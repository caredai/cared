import { z } from 'zod'

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
  prompts?: Record<string, Partial<Omit<Prompt, 'identifier'>> | null>
  // Identifiers of the prompts in the order they should be used
  promptOrder?: string[]
  // Allow any deepest property to be customized
  vendor?: DeepPartial<ModelPreset['vendor']>
}

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
    prompts: z.record(promptSchema.omit({ identifier: true }).partial().nullable()).optional(),
    promptOrder: z.array(z.string()).optional(),
    vendor: modelPresetSchema.required({ vendor: true }).shape.vendor.deepPartial().optional(),
  })

export const modelPresetSettingsSchema: z.ZodType<ModelPresetSettings> = z.object({
  preset: z.string(),
  customizations: z.record(modelPresetCustomizationSchema).optional(),
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
