import { deepmerge } from 'deepmerge-ts'
import isEqual from 'lodash/isEqual'
import { z } from 'zod/v4'

import type { ModelPreset } from '../model-preset'
import type { Prompt } from '../prompt'
import { modelPresetSchema } from '../model-preset'
import { promptSchema } from '../prompt'

export interface ModelPresetSettings {
  // Active model preset name; if conflicted, use the first one.
  preset: string
  // Customizations for the model presets.
  // Key is model preset name, value will customize the corresponding model preset.
  customizations?: Record<string, ModelPresetCustomization>
}

export type ModelPresetCustomization = Partial<
  Omit<ModelPreset, 'utilityPrompts' | 'prompts' | 'vendor'>
> & {
  utilityPrompts?: Partial<ModelPreset['utilityPrompts']>
  // Identifier -> prompt (null means deleting the prompt)
  // Allow overwriting any property (excluding `identifier`) of any existing prompt or adding new prompts or deleting existing prompts
  prompts?: Record<string, PromptCustomization>
  // Identifiers of the prompts in the order they should be used
  promptOrder?: string[]
  // Allow any deepest property to be customized
  vendor?: DeepPartial<ModelPreset['vendor']>
}

export type PromptCustomization = Partial<Omit<Prompt, 'identifier'>> | null

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export const modelPresetCustomizationSchema: z.ZodType<ModelPresetCustomization> = modelPresetSchema
  .omit({
    utilityPrompts: true,
    prompts: true,
    vendor: true,
  })
  .partial()
  .extend({
    utilityPrompts: modelPresetSchema.shape.utilityPrompts.partial().optional(),
    prompts: z.record(z.string(), promptSchema.omit({ identifier: true }).partial().nullable()).optional(),
    promptOrder: z.array(z.string()).optional(),
    vendor: modelPresetSchema.shape.vendor,
  })

export const modelPresetSettingsSchema: z.ZodType<ModelPresetSettings> = z.object({
  preset: z.string(),
  customizations: z.record(z.string(), modelPresetCustomizationSchema).optional(),
})

export function fillInModelPresetSettingsWithDefaults(
  settings?: ModelPresetSettings,
): ModelPresetSettings {
  return (
    settings ?? {
      preset: 'Default',
    }
  )
}

export function modelPresetWithCustomization(
  modelPreset: ModelPreset,
  customization?: ModelPresetCustomization,
): ModelPreset {
  if (!customization) {
    return modelPreset
  }

  const { utilityPrompts, prompts, promptOrder, vendor, ...otherCustomization } = customization

  // Merge prompts with null handling for deletion
  let newPrompts = [...modelPreset.prompts]
  if (prompts) {
    Object.entries(prompts).forEach(([identifier, prompt]) => {
      const index = newPrompts.findIndex((p) => p.identifier === identifier)
      if (prompt === null) {
        // Remove prompt if null
        if (index !== -1) {
          newPrompts.splice(index, 1)
        }
      } else {
        // Update or add prompt
        if (index !== -1) {
          newPrompts[index] = { ...newPrompts[index]!, ...prompt }
        } else {
          newPrompts.push(
            promptSchema.parse({
              identifier,
              ...prompt,
            }),
          )
        }
      }
    })
  }

  // Reorder prompts if promptOrder is provided
  if (promptOrder) {
    // Verify promptOrder matches prompts exactly
    const promptIdentifiers = new Set(newPrompts.map((p) => p.identifier))
    const orderIdentifiers = new Set(promptOrder)
    if (
      promptIdentifiers.size !== orderIdentifiers.size ||
      ![...promptIdentifiers].every((id) => orderIdentifiers.has(id))
    ) {
      throw new Error(
        `promptOrder does not match prompts exactly. Expected ${promptIdentifiers.size} unique identifiers.`,
      )
    }

    // Reorder prompts according to promptOrder
    newPrompts = promptOrder.map(
      (identifier) => newPrompts.find((p) => p.identifier === identifier)!,
    )
  }

  const newModelPreset: ModelPreset = {
    ...modelPreset,
    ...otherCustomization,
    utilityPrompts: {
      ...modelPreset.utilityPrompts,
      ...utilityPrompts,
    },
    prompts: newPrompts,
    vendor: deepmerge(modelPreset.vendor, vendor),
  }

  return modelPresetSchema.parse(newModelPreset)
}

export function sanitizeModelPresetCustomization(
  customization: ModelPresetCustomization,
  modelPreset: ModelPreset,
) {
  const sanitized: ModelPresetCustomization = {}

  const { utilityPrompts, prompts, promptOrder, vendor, ...otherCustomization } = customization

  for (const [key, value] of Object.entries(otherCustomization) as [keyof ModelPreset, any][]) {
    if (!isEqual(value, modelPreset[key])) {
      sanitized[key] = value
    }
  }

  if (utilityPrompts) {
    const up: ModelPresetCustomization['utilityPrompts'] = {}

    for (const [key, value] of Object.entries(utilityPrompts) as [
      keyof ModelPreset['utilityPrompts'],
      any,
    ][]) {
      if (!isEqual(value, modelPreset.utilityPrompts[key])) {
        up[key] = value
      }
    }

    if (Object.keys(up).length > 0) {
      sanitized.utilityPrompts = up
    }
  }

  if (prompts) {
    for (const [identifier, promptCustom] of Object.entries(prompts)) {
      const prompt = modelPreset.prompts.find((p) => p.identifier === identifier)
      if (promptCustom === null) {
        if (prompt) {
          // Delete
          sanitized.prompts = {
            ...sanitized.prompts,
            [identifier]: null,
          }
        }
      } else {
        if (prompt) {
          // Update
          const pc: PromptCustomization = {}

          for (const [key, value] of Object.entries(promptCustom) as [
            keyof NonNullable<PromptCustomization>,
            any,
          ][]) {
            if (!isEqual(value, prompt[key])) {
              if (key === 'injection_position' && !prompt[key] && value === 'relative') {
                continue
              }
              pc[key] = value
            }
          }

          if (Object.keys(pc).length > 0) {
            sanitized.prompts = {
              ...sanitized.prompts,
              [identifier]: pc,
            }
          }
        } else {
          // Add
          sanitized.prompts = {
            ...sanitized.prompts,
            [identifier]: promptCustom,
          }
        }
      }
    }
  }

  if (promptOrder) {
    if (
      !isEqual(
        promptOrder,
        modelPreset.prompts.map((p) => p.identifier),
      )
    ) {
      sanitized.promptOrder = promptOrder
    }
  }

  if (vendor) {
    type Vendor = NonNullable<ModelPreset['vendor']>

    const v: ModelPresetCustomization['vendor'] = {}
    for (const [vendorName, vendorValues] of Object.entries(vendor) as [keyof Vendor, any][]) {
      if (!vendorValues) {
        continue
      }

      const vv = {}
      for (const [key, value] of Object.entries(vendorValues)) {
        // @ts-ignore
        if (!isEqual(value, modelPreset.vendor?.[vendorName]?.[key])) {
          // @ts-ignore
          vv[key] = value
        }
      }
      if (Object.keys(vv).length > 0) {
        v[vendorName] = vv
      }
    }

    if (Object.keys(v).length > 0) {
      sanitized.vendor = v
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}
