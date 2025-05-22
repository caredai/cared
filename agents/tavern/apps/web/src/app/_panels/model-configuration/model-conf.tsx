import type { PromptCustomization } from '@tavern/core'
import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDownIcon, HelpCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@ownxai/ui/components/button'
import { Checkbox } from '@ownxai/ui/components/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@ownxai/ui/components/form'
import { Input } from '@ownxai/ui/components/input'
import { RadioGroup, RadioGroupItem } from '@ownxai/ui/components/radio-group'
import { Slider } from '@ownxai/ui/components/slider'

import { Tooltip } from '@/components/tooltip'
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
              defaultValue={defaultValues.maxContext}
              min={512}
              max={2000000}
              step={1}
            />

            <SliderInputField
              label="Max Response Size (tokens)"
              name="maxTokens"
              control={form.control}
              defaultValue={defaultValues.maxTokens}
              min={0}
              max={2000000}
              step={1}
            />

            <SliderInputField
              label="Temperature"
              name="temperature"
              control={form.control}
              defaultValue={defaultValues.temperature}
              min={0}
              max={1}
              step={0.01}
            />

            <SliderInputField
              label="Top P"
              name="topP"
              control={form.control}
              defaultValue={defaultValues.topP}
              min={0}
              max={1}
              step={0.01}
            />

            <SliderInputField
              label="Top K"
              name="topK"
              control={form.control}
              defaultValue={defaultValues.topK}
              min={0}
              max={500}
              step={1}
            />

            <SliderInputField
              label="Presence Penalty"
              name="presencePenalty"
              control={form.control}
              defaultValue={defaultValues.presencePenalty}
              min={-1}
              max={1}
              step={0.01}
            />

            <SliderInputField
              label="Frequency Penalty"
              name="frequencyPenalty"
              control={form.control}
              defaultValue={defaultValues.frequencyPenalty}
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

function SliderInputField({
  label,
  name,
  control,
  defaultValue,
  min,
  max,
  step,
}: {
  label: string
  name: string
  control: any
  defaultValue: number
  min: number
  max: number
  step: number
}) {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    setInputValue(defaultValue.toString())
  }, [defaultValue])

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex gap-4 items-center">
                <Slider
                  min={min}
                  max={max}
                  step={step}
                  value={[field.value]}
                  onValueChange={([value]) => {
                    field.onChange(value)
                    setInputValue(value!.toString())
                  }}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                  }}
                  onBlur={() => {
                    const numValue = parseFloat(inputValue)
                    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
                      // Round to the nearest step
                      const roundedValue = Math.round(numValue / step) * step
                      setInputValue(roundedValue.toString())
                      field.onChange(roundedValue)
                    } else {
                      // Reset to previous valid value if invalid
                      setInputValue(field.value.toString())
                    }
                  }}
                  className="w-20 h-6.5 px-1.5 py-0.5 rounded-sm text-xs md:text-xs font-mono text-center"
                />
              </div>
            </FormControl>
          </FormItem>
        )
      }}
    />
  )
}

function CheckboxField({
  label,
  name,
  control,
  description,
}: {
  label: string
  name: string
  control: any
  description?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="bg-muted" />
          </FormControl>
          <div className="flex flex-col gap-1 leading-none">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
        </FormItem>
      )}
    />
  )
}

function RadioGroupField({
  label,
  tooltip,
  name,
  control,
  options,
  description,
}: {
  label: string
  tooltip?: string
  name: string
  control: any
  options: { value: string; label: string; description?: string }[]
  description?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col space-y-2">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
                <FormLabel className="cursor-pointer">
                  <div className="flex items-center gap-1">
                    {label}
                    {tooltip && <Tooltip content={tooltip} icon={HelpCircle} />}
                  </div>
                </FormLabel>
                <Button type="button" variant="outline" size="icon" className="size-6">
                  <ChevronDownIcon className="transition-transform duration-200" />
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden flex flex-col gap-2 pt-2">
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-col gap-1.5"
                >
                  {options.map((option) => (
                    <FormItem key={option.value} className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem className="border-ring" value={option.value} />
                      </FormControl>
                      <div className="flex flex-col gap-1 leading-none">
                        <FormLabel className="font-normal">{option.label}</FormLabel>
                        {option.description && (
                          <FormDescription>{option.description}</FormDescription>
                        )}
                      </div>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              {description && <FormDescription>{description}</FormDescription>}
            </CollapsibleContent>
          </Collapsible>
        </FormItem>
      )}
    />
  )
}
