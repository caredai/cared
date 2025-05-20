'use client'

import { useMemo } from 'react'
import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@ownxai/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'

import { isCharacterGroup, useActiveCharacter } from '@/hooks/use-active-character'
import { usePromptInspect } from './prompt-inspect'

export function PromptContentList() {
  const { prompt } = usePromptInspect()
  const characterOrGroup = useActiveCharacter()
  const character = isCharacterGroup(characterOrGroup)
    ? characterOrGroup.characters[0]
    : characterOrGroup

  const list:
    | {
        name: string
        role: string
        content: string
      }[]
    | undefined = useMemo(() => {
    if (!prompt) {
      return
    }
    const mainItem = {
      name: prompt.name,
      role: prompt.role ?? 'system',
    }
    if (!prompt.system_prompt || !prompt.marker) {
      return [
        {
          ...mainItem,
          content: prompt.content ?? '',
        },
      ]
    }
    switch (prompt.identifier) {
      case 'worldInfoBefore':
        return
      case 'personaDescription':
        return
      case 'charDescription':
        return [
          {
            ...mainItem,
            content: character?.content.data.description ?? '',
          },
        ]
      case 'charPersonality':
        return [
          {
            ...mainItem,
            content: character?.content.data.personality ?? '',
          },
        ]
      case 'scenario':
        return [
          {
            ...mainItem,
            content: character?.content.data.scenario ?? '',
          },
        ]
      case 'worldInfoAfter':
        return
      case 'dialogueExamples':
        return [
          {
            ...mainItem,
            content: character?.content.data.mes_example ?? '',
          },
        ]
      case 'chatHistory':
        return
    }
  }, [prompt, character])

  if (!prompt) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 border border-border p-2 rounded-sm bg-black/20 text-sm">
      {list?.map((item, index) => {
        return (
          <Collapsible key={index}>
            <CollapsibleTrigger asChild>
              <div className="flex justify-between items-center [&[data-state=open]_svg]:rotate-180 cursor-pointer text-muted-foreground">
                <span>
                  Name: {item.name}, Role: {item.role}
                </span>

                <Button type="button" variant="outline" size="icon" className="size-6">
                  <ChevronDownIcon className="transition-transform duration-200" />
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden flex flex-col gap-2 p-[1px] pt-2">
              {item.content.split('\n').map((item, index) => (
                <p key={index}>{item}</p>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
