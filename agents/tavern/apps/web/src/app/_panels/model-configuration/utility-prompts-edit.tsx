import { ChevronDownIcon, HelpCircle } from 'lucide-react'

import { Button } from '@ownxai/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@ownxai/ui/components/form'
import { Textarea } from '@ownxai/ui/components/textarea'

import { Tooltip } from '@/components/tooltip'

export function UtilityPromptsEdit({ control }: { control: any }) {
  const utilityPromptFields = [
    {
      name: 'impersonationPrompt',
      label: 'Impersonation Prompt',
      description: 'Prompt that is used for Impersonation function',
    },
    {
      name: 'worldInfoFormat',
      label: 'Lorebook Format Template',
      description:
        'Wraps activated lorebook entries before inserting into the prompt. Use {0} to mark a place where the content is inserted.',
    },
    {
      name: 'scenarioFormat',
      label: 'Scenario Format Template',
      description: 'Use {"{{scenario}}"} to mark a place where the content is inserted.',
    },
    {
      name: 'personalityFormat',
      label: 'Personality Format Template',
      description: 'Use {"{{personality}}"} to mark a place where the content is inserted.',
    },
    {
      name: 'groupNudgePrompt',
      label: 'Group Nudge Prompt Template',
      description:
        'Sent at the end of the group chat history to force reply from a specific character.',
    },
    {
      name: 'newChatPrompt',
      label: 'New Chat',
      description:
        'Set at the beginning of the chat history to indicate that a new chat is about to start.',
    },
    {
      name: 'newGroupChatPrompt',
      label: 'New Group Chat',
      description:
        'Set at the beginning of the chat history to indicate that a new group chat is about to start.',
    },
    {
      name: 'newExampleChatPrompt',
      label: 'New Example Chat',
      description:
        'Set at the beginning of Dialogue examples to indicate that a new example chat is about to start.',
    },
    {
      name: 'continueNudgePrompt',
      label: 'Continue Nudge',
      description: 'Set at the end of the chat history when the continue button is pressed.',
    },
    {
      name: 'sendIfEmpty',
      label: 'Replace Empty Message',
      description: 'Send this text instead of nothing when the text box is empty.',
    },
  ]

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
          <FormLabel className="cursor-pointer">
            <div className="flex items-center gap-1">
              Utility Prompts
              <Tooltip
                content="Configure various utility prompts used in the chat"
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
        {utilityPromptFields.map((field) => (
          <FormField
            key={field.name}
            control={control}
            name={field.name}
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
