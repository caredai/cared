'use client'

import { useMemo } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { VList } from 'virtua'

import { Button } from '@cared/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cared/ui/components/collapsible'

import { usePromptCollections } from '@/hooks/use-prompt-collections'
import { usePromptInspect } from './prompt-inspect'

export function PromptContentList() {
  const promptCollections = usePromptCollections()
  const { prompt } = usePromptInspect()

  const list:
    | {
        identifier: string
        role: string
        content: string
        tokens: number
      }[]
    | undefined = useMemo(() => {
    if (!prompt) {
      return
    }
    const collection = promptCollections.find((c) => c.identifier === prompt.identifier)
    return collection?.messages.map((item) => ({
      identifier: item.identifier,
      role: item.message.role,
      content: item.getText(),
      tokens: item.getTokens(),
    }))
  }, [prompt, promptCollections])

  return (
    <div className="flex-1 flex flex-col gap-2 border border-border p-2 rounded-sm bg-black/20 text-sm">
      {list && list.length > 0 ? (
        <VList count={list.length} className="scrollbar-stable">
          {(i) => {
            const item = list[i]!
            const key = `${item.identifier}-${i}`
            return <PromptContentItem key={key} item={item} />
          }}
        </VList>
      ) : (
        <p>
          No list available{' '}
          {prompt?.injection_position === 'absolute' &&
            'since this prompt is injected into some other prompt'}
        </p>
      )}
    </div>
  )
}

function PromptContentItem({
  item,
}: {
  item: {
    identifier: string
    role: string
    content: string
    tokens: number
  }
}) {
  return (
    <Collapsible className="px-1.5 py-2 my-1 mr-1 border rounded-sm">
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center [&[data-state=open]_svg]:rotate-180 cursor-pointer">
          <span>
            Name: {item.identifier}, Role: {item.role}, Tokens: {item.tokens}
          </span>

          <Button type="button" variant="outline" size="icon" className="size-6">
            <ChevronDownIcon className="transition-transform duration-200" />
          </Button>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden flex flex-col gap-2 p-[1px] pt-2">
        {item.content.trim() ? (
          item.content.split('\n').map((line, index) => <p key={index}>{line}</p>)
        ) : (
          <p>No content</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
