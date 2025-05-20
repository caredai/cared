import { useEffect } from 'react'
import * as Portal from '@radix-ui/react-portal'
import { atom, useAtom } from 'jotai'
import { XIcon } from 'lucide-react'

import { Button } from '@ownxai/ui/components/button'
import { Label } from '@ownxai/ui/components/label'

import { usePrompt } from '@/hooks/use-prompt'
import { useContentAreaRef, useIsShowPromptInspect } from '@/hooks/use-show-in-content-area'
import { PromptContentList } from './prompt-content-list'
import { usePromptEdit } from './prompt-edit'

const inspectPromptIdAtom = atom<string>()

export function usePromptInspect() {
  const [inspectPromptId, setInspectPromptId] = useAtom(inspectPromptIdAtom)

  const { isShowPromptInspect, setIsShowPromptInspect } = useIsShowPromptInspect()

  const openPromptInspect = (identifier: string) => {
    setInspectPromptId(identifier)
    setIsShowPromptInspect(true)
  }

  const closePromptInspect = () => {
    setInspectPromptId(undefined)
    setIsShowPromptInspect(false)
  }

  const togglePromptInspect = (identifier: string) => {
    if (inspectPromptId && inspectPromptId !== identifier) {
      setInspectPromptId(identifier)
      return
    }
    const isShow = !isShowPromptInspect
    setInspectPromptId(isShow ? identifier : undefined)
    setIsShowPromptInspect(isShow)
  }

  useEffect(() => {
    if (!isShowPromptInspect) {
      setInspectPromptId(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowPromptInspect])

  const prompt = usePrompt(inspectPromptId)

  return {
    prompt,
    isShowPromptInspect,
    openPromptInspect,
    closePromptInspect,
    togglePromptInspect,
  }
}

export function PromptInspect() {
  const { prompt, isShowPromptInspect, closePromptInspect } = usePromptInspect()
  const { contentAreaRef } = useContentAreaRef()
  const { openPromptEdit } = usePromptEdit()

  if (!isShowPromptInspect || !prompt) {
    return null
  }

  return (
    <Portal.Root
      container={contentAreaRef?.current}
      className="absolute w-full h-full z-5000 flex flex-col gap-6 p-4 overflow-y-auto bg-background border border-border rounded-lg shadow-lg"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium">
          <span className="truncate">{prompt.name}</span>{' '}
          <span className="text-md text-muted-foreground">
            - Prompt Inspect
            {prompt.system_prompt || prompt.marker ? (
              <span className="text-sm">
                {' '}
                ({prompt.system_prompt ? `System prompt: ${prompt.identifier}` : ''}
                {prompt.system_prompt && prompt.marker ? '; ' : ''}
                {prompt.marker ? `Marker: true` : ''})
              </span>
            ) : null}
          </span>
        </h1>

        <Button variant="outline" size="icon" className="size-6" onClick={closePromptInspect}>
          <XIcon />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <Button onClick={() => openPromptEdit(prompt.identifier)}>Edit</Button>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <Label>Prompt List</Label>
          <div className="text-[0.8rem] text-muted-foreground">
            The list of prompts associated with this item
          </div>
          <PromptContentList />
        </div>
      </div>
    </Portal.Root>
  )
}
