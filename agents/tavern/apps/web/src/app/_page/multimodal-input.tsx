'use client'

import type { UseChatHelpers } from '@ai-sdk/react'
import type { UIMessage } from '@tavern/core'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect } from 'react'
import {
  faBars,
  faCircleStop,
  faMagicWandSparkles,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { AutoGrowTextarea } from '@/components/auto-grow-textarea'

export function MultimodalInput({
  input,
  setInput,
  status,
  stop,
  setMessages,
  sendMessage,
  scrollToBottom,
  disabled,
}: {
  input: string
  setInput: Dispatch<SetStateAction<string>>
  status: UseChatHelpers<UIMessage>['status']
  stop: () => void
  setMessages: UseChatHelpers<UIMessage>['setMessages']
  sendMessage: UseChatHelpers<UIMessage>['sendMessage']
  scrollToBottom: () => void
  disabled: boolean
}) {
  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom()
    }
  }, [status, scrollToBottom])

  const submit = useCallback(() => {
    if (disabled) {
      return
    }
    if (status === 'error') {
      // TODO
    } else if (status !== 'ready') {
      return
    }
    void sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] })
    setInput('')
  }, [input, setInput, sendMessage, status, disabled])

  return (
    <div className="pt-[1px] pb-[5px] bg-transparent">
      <div className="flex flex-row items-center rounded-b-lg px-1 text-sm bg-background focus-within:ring-1 focus-within:ring-ring">
        <button className="inline-flex" disabled={disabled}>
          <FontAwesomeIcon
            icon={faBars}
            size="2x"
            className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"
          />
        </button>
        <button className="inline-flex" disabled={disabled}>
          <FontAwesomeIcon
            icon={faMagicWandSparkles}
            size="2x"
            className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"
          />
        </button>
        <AutoGrowTextarea
          className="flex-1 min-h-[36px] max-h-[50dvh] text-white focus:outline-none border-0 focus-visible:ring-0 resize-y rounded-none"
          placeholder="Type your message..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              submit()
            }
          }}
        />
        <button
          className="inline-flex ml-1"
          disabled={disabled || status === 'submitted' || status === 'streaming'}
          onClick={(event) => {
            event.preventDefault()
            if (status === 'ready' || status === 'error') {
              submit()
            } else {
              stop()
              setMessages((messages) => messages)
            }
          }}
        >
          <FontAwesomeIcon
            icon={status === 'ready' || status === 'error' ? faPaperPlane : faCircleStop}
            size="2x"
            className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"
          />
        </button>
      </div>
    </div>
  )
}
