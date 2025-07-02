import type { Message, MessageContent } from '@tavern/core'
import type { UIMessage } from 'ai'
import type { VListHandle } from 'virtua'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { buildPromptMessages } from '@tavern/core'
import hash from 'stable-hash'

import { generateMessageId } from '@ownxai/sdk'

import { CircleSpinner } from '@/components/spinner'
import { useActive } from '@/hooks/use-active'
import { isCharacter, isCharacterGroup } from '@/hooks/use-character-or-group'
import { useCachedMessage } from '@/hooks/use-message'
import { useMessageTree } from '@/hooks/use-message-tree'
import { ContentArea } from './content-area'
import { useCallWhenGenerating } from './hooks'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'

export function Chat() {
  const { settings, modelPreset, model, charOrGroup, persona, chat } = useActive()

  const chatId = chat?.id

  const { branch, branchRef, navigate, isLoading, isSuccess, hasNextPage, isChatLoading } =
    useMessageTree()

  const { addCachedMessage, updateCachedMessage } = useCachedMessage(chat)

  const prepareRequestBody = useCallback(
    ({ id, messages: uiMessages }: { id: string; messages: UIMessage[] }) => {
      if (!chat || !model || !persona || !charOrGroup) {
        throw new Error('Not initialized')
      }

      const lastUiMessage = uiMessages[uiMessages.length - 1]
      if (!lastUiMessage) {
        throw new Error('No messages')
      }

      let content = {
        parts: lastUiMessage.parts,
        experimental_attachments: lastUiMessage.experimental_attachments,
      } as MessageContent

      const messages = branch.map((node) => node.message)
      const last = messages[messages.length - 1]
      const secondLast = messages[messages.length - 2]

      let lastMessage: Message

      if (lastUiMessage.id === last?.id || lastUiMessage.id === secondLast?.id) {
        let msg = {} as Message
        if (lastUiMessage.id === last?.id) {
          msg = last
        } else if (lastUiMessage.id === secondLast?.id) {
          msg = secondLast
          // Remove the last message
          messages.splice(messages.length - 1, 1)
        }

        content = {
          ...content,
          annotations: [
            {
              // TODO
              characterId: isCharacter(charOrGroup)
                ? charOrGroup.id
                : charOrGroup.characters[0]?.id,
              modelId: model.id,
            },
          ],
        }

        lastMessage = {
          ...msg,
          content,
        }
        messages[messages.length - 1] = lastMessage
        updateCachedMessage(lastMessage)
      } else {
        content = {
          ...content,
          annotations: [
            {
              personaId: persona.id,
              personaName: persona.name,
            },
          ],
        }

        lastMessage = {
          id: lastUiMessage.id,
          chatId: id,
          parentId: last?.id ?? null,
          role: lastUiMessage.role as any,
          content,
          createdAt: lastUiMessage.createdAt ?? new Date(),
        } as Message
        messages.push(lastMessage)
        addCachedMessage(lastMessage)
      }

      // TODO
      const nextChar = isCharacter(charOrGroup) ? charOrGroup : charOrGroup.characters[0]
      if (!nextChar) {
        throw new Error('No character')
      }

      const promptMessages = buildPromptMessages({
        messages: branch, // TODO
        chat,
        settings,
        modelPreset,
        model,
        persona,
        character: nextChar.content,
        group: isCharacterGroup(charOrGroup) ? charOrGroup : undefined,
      })

      return {
        id,
        messages: promptMessages,
        lastMessage,
        characterId: nextChar.id,
        modelId: model.id,
      }
    },
    [
      chat,
      branch,
      model,
      settings,
      modelPreset,
      charOrGroup,
      updateCachedMessage,
      persona,
      addCachedMessage,
    ],
  )

  const { messages, setMessages, handleSubmit, input, setInput, append, status, stop } = useChat({
    id: chatId,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateMessageId,
    experimental_prepareRequestBody: prepareRequestBody,
    onFinish: (...args) => console.log('onFinish', ...args),
    onError: (error) => console.error('onError', error),
  })

  useEffect(() => {
    const lastUiMessage = messages[messages.length - 1]
    if (lastUiMessage?.role !== 'assistant') {
      return
    }

    const msgs = branch.map((node) => node.message)
    const last = msgs[msgs.length - 1]

    const content = {
      parts: lastUiMessage.parts,
      experimental_attachments: lastUiMessage.experimental_attachments,
      annotations: [
        {
          // TODO
          characterId: isCharacter(charOrGroup) ? charOrGroup.id : charOrGroup?.characters[0]?.id,
          modelId: model?.id,
        },
      ],
    } as MessageContent

    if (!last || lastUiMessage.id > last.id) {
      addCachedMessage({
        id: lastUiMessage.id,
        chatId: chatId,
        parentId: last?.id ?? null,
        role: lastUiMessage.role as any,
        content,
        createdAt: lastUiMessage.createdAt ?? new Date(),
      } as Message)
    } else if (lastUiMessage.id === last.id && hash(content) !== hash(last.content)) {
      updateCachedMessage({
        ...last,
        content,
      })
    }

    if (status === 'ready' || status === 'error') {
      setMessages([])
    }
  }, [
    branch,
    messages,
    setMessages,
    status,
    persona,
    charOrGroup,
    model,
    chatId,
    addCachedMessage,
    updateCachedMessage,
  ])

  const ref = useRef<VListHandle>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((smooth?: boolean) => {
    // There always exists a `div` at the end of the list, so we can scroll to it.
    const index = branchRef.current.length
    ref.current?.scrollToIndex(index, {
      align: 'end',
      // Using smooth scrolling over many items can kill performance benefit of virtual scroll.
      smooth: typeof smooth === 'boolean' ? smooth : true,
    })
  }, [])

  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)
  useEffect(() => {
    if (isSuccess && !hasNextPage) {
      setShouldScrollToBottom(true)
    }
  }, [isSuccess, hasNextPage])
  useEffect(() => {
    if (shouldScrollToBottom) {
      // Scroll to bottom when the chat is loaded.
      scrollToBottom(false)
      setShouldScrollToBottom(false)
    }
  }, [scrollToBottom, shouldScrollToBottom])

  useCallWhenGenerating(
    chatId,
    status,
    useCallback(() => {
      // Always scroll to bottom when the message list changes.
      if (branch.length) {
        scrollToBottom()
      }
    }, [scrollToBottom, branch]),
  )

  return (
    <>
      <ContentArea>
        {(isChatLoading || isLoading || hasNextPage) /* TODO */ && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <CircleSpinner />
          </div>
        )}
        <Messages ref={ref} endRef={endRef} messages={branch} status={status} navigate={navigate} />
      </ContentArea>

      <MultimodalInput
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        messages={messages}
        setMessages={setMessages}
        append={append}
        handleSubmit={handleSubmit}
        scrollToBottom={scrollToBottom}
        disabled={isLoading}
      />
    </>
  )
}
