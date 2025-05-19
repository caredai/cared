import { useEffect } from 'react'
import { XIcon } from 'lucide-react'
import { Prompt } from '@tavern/core'
import { atom, useAtom } from 'jotai'
import * as Portal from '@radix-ui/react-portal'
import { Button } from '@ownxai/ui/components/button'
import { useContentAreaRef, useIsShowPromptInspect } from '@/hooks/use-show-in-content-area'
import { usePromptEdit } from './prompt-edit'

const inspectPromptAtom = atom<Prompt>()

export function usePromptInspect() {
  const [, setInspectPrompt] = useAtom(inspectPromptAtom)

  const { isShowPromptInspect, setIsShowPromptInspect } = useIsShowPromptInspect()

  const openPromptInspect = (prompt: Prompt) => {
    setInspectPrompt(prompt)
    setIsShowPromptInspect(true)
  }

  const closePromptInspect = () => {
    setInspectPrompt(undefined)
    setIsShowPromptInspect(false)
  }

  useEffect(() => {
    if (isShowPromptInspect) {
      setInspectPrompt(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowPromptInspect])

  return {
    isShowPromptInspect,
    openPromptInspect,
    closePromptInspect,
  }
}

export function PromptInspect() {
  const { isShowPromptInspect, closePromptInspect } = usePromptInspect()
  const [prompt] = useAtom(inspectPromptAtom)
  const { contentAreaRef } = useContentAreaRef()
  const { openPromptEdit } = usePromptEdit()

  if (!isShowPromptInspect || !prompt) {
    return null
  }

  return (
    <Portal.Root
      container={contentAreaRef?.current}
      className="absolute w-full h-full z-5000 flex flex-col gap-6 p-2 overflow-y-auto bg-background border border-border rounded-lg shadow-lg"
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{prompt.name}</h2>
          <Button onClick={() => openPromptEdit(prompt)}>Edit</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
            <p>{prompt.role}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Injection Position</h3>
            <p>{prompt.injection_position}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Content</h3>
          <pre className="p-4 bg-muted rounded-lg whitespace-pre-wrap font-mono text-sm">
            {prompt.content || 'No content'}
          </pre>
        </div>
      </div>
    </Portal.Root>
  )
}
