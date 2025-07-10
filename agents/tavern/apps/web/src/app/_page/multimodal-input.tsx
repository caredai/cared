'use client'

import type { Chat as AIChat, UseChatHelpers } from '@ai-sdk/react'
import type { MessageNode, UIMessage } from '@tavern/core'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useCallback, useMemo } from 'react'
import {
  faBars,
  faCircleStop,
  faMagicWandSparkles,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { toUIMessages } from '@tavern/core'

import { AutoGrowTextarea } from '@/components/auto-grow-textarea'
import { cn } from '@/lib/utils'

export function MultimodalInput({
  input,
  setInput,
  messagesRef,
  chatRef,
  status,
  setMessages,
  disabled,
}: {
  input: string
  setInput: Dispatch<SetStateAction<string>>
  messagesRef: RefObject<MessageNode[]>
  chatRef: RefObject<AIChat<UIMessage>>
  status: UseChatHelpers<UIMessage>['status']
  setMessages: UseChatHelpers<UIMessage>['setMessages']
  disabled: boolean
}) {
  const [lastIsUserMessage, lastMessage] = useMemo(() => {
    const lastMessage = messagesRef.current.at(-1)?.message
    const hasContent = !!lastMessage?.content.parts.filter(
      (p) => p.type === 'text' && p.text.trim(),
    ).length
    return [lastMessage?.role === 'user' && hasContent, lastMessage]
  }, [messagesRef.current])

  const submit = useCallback(() => {
    if (disabled) {
      return
    }
    if (status === 'error') {
      // TODO
    } else if (status !== 'ready') {
      return
    }
    if (!input.trim()) {
      if (lastIsUserMessage && lastMessage) {
        // If the last message is user message
        setMessages(toUIMessages([lastMessage]))
        void chatRef.current.regenerate()
      }
      return
    }
    void chatRef.current.sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: input.trim() }],
    })
    setInput('')
  }, [disabled, status, input, chatRef, setInput, lastIsUserMessage, lastMessage, setMessages])

  const disabledSend = disabled || (!input.trim() && !lastIsUserMessage)

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
          disabled={disabledSend}
          onClick={(event) => {
            event.preventDefault()
            if (status === 'ready' || status === 'error') {
              submit()
            } else {
              void chatRef.current.stop()
              setMessages((messages) => messages)
            }
          }}
        >
          <FontAwesomeIcon
            icon={status === 'ready' || status === 'error' ? faPaperPlane : faCircleStop}
            size="2x"
            className={cn(
              'fa-fw text-muted-foreground  transition-colors duration-200',
              !disabledSend && 'hover:text-foreground',
            )}
          />
        </button>
      </div>
    </div>
  )
}
