'use client'

import type { Chat as AIChat, UseChatHelpers } from '@ai-sdk/react'
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons'
import type { MessageNode, UIMessage } from '@tavern/core'
import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react'
import { useCallback } from 'react'
import {
  faArrowRight,
  faBars,
  faCircleStop,
  // faMagicWandSparkles,
  faPaperPlane,
  faRotate,
  faUserSecret,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'

import { AutoGrowTextarea } from '@/components/auto-grow-textarea'
import { cn } from '@/lib/utils'

export function MultimodalInput({
  input,
  setInput,
  chatRef,
  status,
  messages,
  setMessages,
  disabled,
  submit,
  regenerate,
  impersonate,
  continue_,
}: {
  input: string
  setInput: Dispatch<SetStateAction<string>>
  chatRef: RefObject<AIChat<UIMessage>>
  status: UseChatHelpers<UIMessage>['status']
  messages: MessageNode[]
  setMessages: UseChatHelpers<UIMessage>['setMessages']
  disabled: boolean
  submit: (input: string) => void
  regenerate: () => void
  impersonate: () => void
  continue_: () => void
}) {
  const onSubmit = useCallback(() => {
    if (disabled) {
      return
    }
    if (status === 'error') {
      // TODO
    } else if (status !== 'ready') {
      return
    }
    submit(input.trim())
    setInput('')
  }, [disabled, status, input, setInput, submit])

  const lastMessage = messages.at(-1)?.message

  const menuActions = [
    {
      action: regenerate,
      icon: faRotate,
      title: 'Regenerate',
      disabled: lastMessage?.role !== 'assistant' || !lastMessage.parentId,
    },
    {
      action: impersonate,
      icon: faUserSecret,
      title: 'Impersonate',
    },
    {
      action: continue_,
      icon: faArrowRight,
      title: 'Continue',
      disabled:
        lastMessage?.role !== 'assistant' ||
        !lastMessage.parentId ||
        lastMessage.content.metadata.excluded,
    },
  ]

  return (
    <div className="pt-[1px] pb-[5px] bg-transparent">
      <div className="flex flex-row items-center rounded-b-lg px-1 text-sm bg-background focus-within:ring-1 focus-within:ring-ring">
        <MenuActionsDropdownMenu
          trigger={
            <button className="inline-flex" disabled={disabled}>
              <FontAwesomeIcon
                icon={faBars}
                size="2x"
                className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"
              />
            </button>
          }
          actions={menuActions}
        />
        {/*<button className="inline-flex" disabled={disabled}>*/}
        {/*  <FontAwesomeIcon*/}
        {/*    icon={faMagicWandSparkles}*/}
        {/*    size="2x"*/}
        {/*    className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"*/}
        {/*  />*/}
        {/*</button>*/}
        <AutoGrowTextarea
          className="flex-1 min-h-[36px] max-h-[50dvh] text-white focus:outline-none border-0 focus-visible:ring-0 resize-y rounded-none"
          placeholder="Type your message..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              onSubmit()
            }
          }}
        />
        <button
          className="inline-flex ml-1"
          disabled={disabled}
          onClick={(event) => {
            event.preventDefault()
            if (status === 'ready' || status === 'error') {
              onSubmit()
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
              !disabled && 'hover:text-foreground',
            )}
          />
        </button>
      </div>
    </div>
  )
}

export function MenuActionsDropdownMenu({
  trigger,
  actions,
}: {
  trigger: ReactNode
  actions: {
    action: () => void
    icon: IconDefinition
    title: string
    disabled?: boolean
  }[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="z-5000" side="top" align="start">
        {actions.map(({ action, icon, title, disabled }) => (
          <DropdownMenuItem
            key={title}
            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors duration-200 text-md"
            onClick={() => action()}
            disabled={disabled}
          >
            <FontAwesomeIcon icon={icon} size="1x" className="fa-fw" />
            {title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
