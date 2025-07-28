import type { ModelPreset } from '@tavern/core'
import type { UseFormReturn } from 'react-hook-form'
import { ChevronDownIcon, HelpCircle } from 'lucide-react'
import { z } from 'zod/v4'

import { Button } from '@cared/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cared/ui/components/collapsible'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@cared/ui/components/form'
import { Textarea } from '@cared/ui/components/textarea'

import { Tooltip } from '@/components/tooltip'

export const quickPromptsFormSchema = z.object({
  quickPromptMain: z.string(),
  quickPromptNsfw: z.string(),
  quickPromptJailbreak: z.string(),
})

export type QuickPromptsFormValues = z.infer<typeof quickPromptsFormSchema>

export function quickPromptsDefaultValues(preset: ModelPreset) {
  const mainPrompt = preset.prompts.find((p) => p.identifier === 'main')
  const nsfwPrompt = preset.prompts.find((p) => p.identifier === 'nsfw')
  const jailbreakPrompt = preset.prompts.find((p) => p.identifier === 'jailbreak')

  return {
    quickPromptMain: mainPrompt?.content ?? '',
    quickPromptNsfw: nsfwPrompt?.content ?? '',
    quickPromptJailbreak: jailbreakPrompt?.content ?? '',
  }
}

export function QuickPromptsEdit({ form }: { form: UseFormReturn<any> }) {
  const quickPromptFields = [
    {
      name: 'quickPromptMain',
      label: 'Main',
      description: 'Main system prompt that is always included in the context.',
    },
    {
      name: 'quickPromptNsfw',
      label: 'Auxiliary',
      description: 'Additional instructions that are included when NSFW content is enabled.',
    },
    {
      name: 'quickPromptJailbreak',
      label: 'Post-History Instructions',
      description: 'Instructions that are appended after the chat history.',
    },
  ]

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
          <FormLabel className="cursor-pointer">
            <div className="flex items-center gap-1">
              Quick Prompts Edit
              <Tooltip
                content="Configure main system prompts and additional instructions"
                icon={HelpCircle}
              />
            </div>
          </FormLabel>
          <Button type="button" variant="outline" size="icon" className="size-6">
            <ChevronDownIcon className="transition-transform duration-200" />
          </Button>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden flex flex-col gap-2 pt-2">
        {quickPromptFields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name as keyof QuickPromptsFormValues}
            render={({ field: formField }) => (
              <FormItem className="mx-[1px]">
                <FormLabel>{field.label}</FormLabel>
                <FormDescription>{field.description}</FormDescription>
                <FormControl>
                  <Textarea {...formField} className="h-20" />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
