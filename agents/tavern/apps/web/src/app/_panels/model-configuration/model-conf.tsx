import type { PromptCustomization } from '@tavern/core'
import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@ownxai/ui/components/form'
import { Input } from '@ownxai/ui/components/input'

import { CheckboxField } from '@/components/checkbox-field'
import { RadioGroupField } from '@/components/radio-group-field'
import { SliderInputField } from '@/components/slider-input-field'
import { useCustomizeModelPreset } from '@/hooks/use-model-preset'
import {
  quickPromptsDefaultValues,
  QuickPromptsEdit,
  quickPromptsFormSchema,
} from './quick-prompts-edit'
import { UtilityPromptsEdit } from './utility-prompts-edit'

const modelConfFormSchema = z
  .object({
    maxContext: z.number().min(512).max(2000000).step(1),
    maxTokens: z.number().min(0).max(2000000).step(1),
    temperature: z.number().min(0).max(1).step(0.01),
    topP: z.number().min(0).max(1).step(0.01),
    topK: z.number().min(0).max(500).step(1),
    presencePenalty: z.number().min(-1).max(1).step(0.01),
    frequencyPenalty: z.number().min(-1).max(1).step(0.01),
    seed: z.number().min(-1).step(1),
    wrapInQuotes: z.boolean(),
    continuePrefill: z.boolean(),
    squashSystemMessages: z.boolean(),
    disableSendingAttachments: z.boolean(),
    disableTools: z.boolean(),
    disableSendingReasoning: z.boolean(),
    characterNameBehavior: z.enum(['none', 'default', 'completion', 'content']),
    continuePostfix: z.enum(['none', 'space', 'newline', 'double-newline']),
    // Utility Prompts fields
    impersonationPrompt: z.string(),
    newChatPrompt: z.string(),
    newGroupChatPrompt: z.string(),
    newExampleChatPrompt: z.string(),
    continueNudgePrompt: z.string(),
    groupNudgePrompt: z.string(),
    worldInfoFormat: z.string(),
    scenarioFormat: z.string(),
    personalityFormat: z.string(),
    sendIfEmpty: z.string(),
  })
  .merge(quickPromptsFormSchema)

export function ModelConf() {
  const {
    activeCustomizedPreset: preset,
    customization,
    saveCustomization,
  } = useCustomizeModelPreset()

  const defaultValues = useMemo(
    () => ({
      maxContext: preset.maxContext ?? 4095,
      maxTokens: preset.maxTokens ?? 300,
      temperature: preset.temperature ?? 0,
      topP: preset.topP ?? 1,
      topK: preset.topK ?? 0,
      presencePenalty: preset.presencePenalty ?? 0,
      frequencyPenalty: preset.frequencyPenalty ?? 0,
      seed: preset.seed ?? -1,
      wrapInQuotes: preset.wrapInQuotes ?? false,
      continuePrefill: preset.continuePrefill ?? false,
      squashSystemMessages: preset.squashSystemMessages ?? false,
      disableSendingAttachments: preset.disableSendingAttachments ?? false,
      disableTools: preset.disableTools ?? false,
      disableSendingReasoning: preset.disableSendingReasoning ?? false,
      characterNameBehavior: preset.characterNameBehavior ?? 'default',
      continuePostfix: preset.continuePostfix ?? 'space',
      // Utility Prompts fields
      impersonationPrompt: preset.utilityPrompts.impersonationPrompt,
      newChatPrompt: preset.utilityPrompts.newChatPrompt,
      newGroupChatPrompt: preset.utilityPrompts.newGroupChatPrompt,
      newExampleChatPrompt: preset.utilityPrompts.newExampleChatPrompt,
      continueNudgePrompt: preset.utilityPrompts.continueNudgePrompt,
      groupNudgePrompt: preset.utilityPrompts.groupNudgePrompt,
      worldInfoFormat: preset.utilityPrompts.worldInfoFormat,
      scenarioFormat: preset.utilityPrompts.scenarioFormat,
      personalityFormat: preset.utilityPrompts.personalityFormat,
      sendIfEmpty: preset.utilityPrompts.sendIfEmpty,
      ...quickPromptsDefaultValues(preset),
    }),
    [preset],
  )

  const form = useForm({
    resolver: zodResolver(modelConfFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const onSubmit = (values: z.infer<typeof modelConfFormSchema>) => {
    const {
      impersonationPrompt,
      newChatPrompt,
      newGroupChatPrompt,
      newExampleChatPrompt,
      continueNudgePrompt,
      groupNudgePrompt,
      worldInfoFormat,
      scenarioFormat,
      personalityFormat,
      sendIfEmpty,
      quickPromptMain,
      quickPromptNsfw,
      quickPromptJailbreak,
      ...otherValues
    } = values

    const promptValues = {
      main: quickPromptMain,
      nsfw: quickPromptNsfw,
      jailbreak: quickPromptJailbreak,
    }
    const prompts = {} as Record<string, PromptCustomization>
    for (const prompt of preset.prompts) {
      if (['main', 'nsfw', 'jailbreak'].includes(prompt.identifier)) {
        prompts[prompt.identifier] = {
          ...prompt,
          content: promptValues[prompt.identifier as keyof typeof promptValues],
        }
      }
    }

    void saveCustomization({
      ...customization,
      ...otherValues,
      utilityPrompts: {
        impersonationPrompt,
        newChatPrompt,
        newGroupChatPrompt,
        newExampleChatPrompt,
        continueNudgePrompt,
        groupNudgePrompt,
        worldInfoFormat,
        scenarioFormat,
        personalityFormat,
        sendIfEmpty,
      },
      prompts,
    })
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form
          onBlur={() => {
            onSubmit(modelConfFormSchema.parse(form.getValues()))
          }}
          className="space-y-4"
        >
          <div>
            <SliderInputField
              label="Context Size (tokens)"
              name="maxContext"
              control={form.control}
              min={512}
              max={2000000}
              step={1}
            />

            <SliderInputField
              label="Max Response Size (tokens)"
              name="maxTokens"
              control={form.control}
              min={0}
              max={2000000}
              step={1}
            />

            <SliderInputField
              label="Temperature"
              name="temperature"
              control={form.control}
              min={0}
              max={1}
              step={0.01}
            />

            <SliderInputField
              label="Top P"
              name="topP"
              control={form.control}
              min={0}
              max={1}
              step={0.01}
            />

            <SliderInputField
              label="Top K"
              name="topK"
              control={form.control}
              min={0}
              max={500}
              step={1}
            />

            <SliderInputField
              label="Presence Penalty"
              name="presencePenalty"
              control={form.control}
              min={-1}
              max={1}
              step={0.01}
            />

            <SliderInputField
              label="Frequency Penalty"
              name="frequencyPenalty"
              control={form.control}
              min={-1}
              max={1}
              step={0.01}
            />
          </div>

          <QuickPromptsEdit form={form} />

          <UtilityPromptsEdit control={form.control} />

          <FormField
            control={form.control}
            name="seed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seed</FormLabel>
                <FormDescription>
                  Set to get deterministic results. Use -1 for random seed.
                </FormDescription>
                <FormControl>
                  <Input
                    type="number"
                    min={-1}
                    step={1}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="w-full h-6.5 px-1.5 py-0.5 rounded-sm text-xs md:text-xs font-mono"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <RadioGroupField
            label="Character Name Behavior"
            tooltip="Helps the model to associate messages with characters."
            name="characterNameBehavior"
            control={form.control}
            options={[
              {
                value: 'none',
                label: 'None',
                description:
                  'Never add character name prefixes. May behave poorly in groups, choose with caution.',
              },
              {
                value: 'default',
                label: 'Default',
                description:
                  'Add prefixes for groups and past personas. Otherwise, make sure you provide names in the prompt.',
              },
              {
                value: 'completion',
                label: 'Completion Object',
                description:
                  'Add character names to completion objects. Restrictions apply: only Latin alphanumerics and underscores.',
              },
              {
                value: 'content',
                label: 'Message Content',
                description: 'Prepend character names to message contents.',
              },
            ]}
          />

          <RadioGroupField
            label="Continue Postfix"
            tooltip="The next chunk of the continued message will be appended using this as a separator."
            name="continuePostfix"
            control={form.control}
            options={[
              { value: 'none', label: 'None' },
              { value: 'space', label: 'Space' },
              { value: 'newline', label: 'Newline' },
              { value: 'double-newline', label: 'Double Newline' },
            ]}
          />

          <div className="space-y-2">
            <CheckboxField
              label="Wrap in Quotes"
              name="wrapInQuotes"
              control={form.control}
              description="Wrap entire user message in quotes before sending.
Leave off if you use quotes manually for speech."
            />

            <CheckboxField
              label="Continue Prefill"
              name="continuePrefill"
              control={form.control}
              description="Continue sends the last message as assistant role instead of system message with instruction."
            />

            <CheckboxField
              label="Squash System Messages"
              name="squashSystemMessages"
              control={form.control}
              description="Combines consecutive system messages into one (excluding example dialogues). May improve coherence for some models."
            />

            <CheckboxField
              label="Disable Sending Attachments"
              name="disableSendingAttachments"
              control={form.control}
              description="Prevent sending any file attachments to the model."
            />

            <CheckboxField
              label="Disable Tools"
              name="disableTools"
              control={form.control}
              description="Prevent the model from using any external tools."
            />

            <CheckboxField
              label="Disable Sending Reasoning"
              name="disableSendingReasoning"
              control={form.control}
              description="Prevent the model from explaining its reasoning process in responses."
            />
          </div>
        </form>
      </Form>
    </div>
  )
}
