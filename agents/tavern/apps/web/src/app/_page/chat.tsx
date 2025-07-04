import type { Message, MessageContent, UIMessage } from '@tavern/core'
import type { PrepareSendMessagesRequest } from 'ai'
import type { VListHandle } from 'virtua'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Chat as AIChat, useChat } from '@ai-sdk/react'
import { buildPromptMessages } from '@tavern/core'
import { DefaultChatTransport } from 'ai'
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
import { fetchWithErrorHandlers } from './utils'

export function Chat() {
  const { settings, modelPreset, model, charOrGroup, persona, chat } = useActive()

  const chatId = chat?.id

  const { branch, branchRef, navigate, isLoading, isSuccess, hasNextPage, isChatLoading } =
    useMessageTree()

  const { addCachedMessage, updateCachedMessage } = useCachedMessage(chat)

  const prepareSendMessagesRequest = ({
    id,
    messages: uiMessages,
    body,
  }: Parameters<PrepareSendMessagesRequest<UIMessage>>[0]) => {
    if (!chat || !model || !persona || !charOrGroup) {
      throw new Error('Not initialized')
    }

    const lastUiMessage = uiMessages.at(-1)
    if (!lastUiMessage) {
      throw new Error('No messages')
    }

    const content = {
      parts: lastUiMessage.parts,
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

      content.metadata = {
        // TODO
        characterId: isCharacter(charOrGroup) ? charOrGroup.id : charOrGroup.characters[0]?.id,
        modelId: model.id,
      }

      lastMessage = {
        ...msg,
        content,
      }
      messages[messages.length - 1] = lastMessage
      updateCachedMessage(lastMessage)
    } else {
      content.metadata = {
        personaId: persona.id,
        personaName: persona.name,
      }

      lastMessage = {
        id: lastUiMessage.id,
        chatId: id,
        parentId: last?.id ?? null,
        role: lastUiMessage.role,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      messages: [
        ...branch,
        {
          message: lastMessage,
          descendants: [],
        },
      ], // TODO
      chat,
      settings,
      modelPreset,
      model,
      persona,
      character: nextChar.content,
      group: isCharacterGroup(charOrGroup) ? charOrGroup : undefined,
    })

    return {
      body: {
        id,
        messages: promptMessages,
        lastMessage,
        characterId: nextChar.id,
        modelId: model.id,
        ...body,
      },
    }
  }

  const aiChat = useRef(
    new AIChat({
      id: chatId,
      generateId: generateMessageId,
      transport: new DefaultChatTransport({
        api: '/api/chat',
        fetch: fetchWithErrorHandlers,
        prepareSendMessagesRequest,
      }),
      onFinish: (...args) => console.log('onFinish', ...args),
      onError: (error) => console.error('onError', error),
    }),
  )

  const onMessagesChange = () => {
    const lastUiMessage = aiChat.current.messages.at(-1)
    if (lastUiMessage?.role !== 'assistant') {
      return
    }

    const msgs = branch.map((node) => node.message)
    const last = msgs[msgs.length - 1]

    const content = {
      parts: lastUiMessage.parts,
      metadata: {
        // TODO
        characterId: isCharacter(charOrGroup) ? charOrGroup.id : charOrGroup?.characters[0]?.id,
        modelId: model?.id,
      },
    } as MessageContent

    if (!last || lastUiMessage.id > last.id) {
      addCachedMessage({
        id: lastUiMessage.id,
        chatId: chatId,
        parentId: last?.id ?? null,
        role: lastUiMessage.role,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Message)
    } else if (lastUiMessage.id === last.id && hash(content) !== hash(last.content)) {
      updateCachedMessage({
        ...last,
        content,
      })
    }
  }

  useEffect(() => {
    return aiChat.current['~registerMessagesCallback'](onMessagesChange, 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { messages, setMessages, sendMessage, status, stop } = useChat<UIMessage>({
    chat: aiChat.current,
    experimental_throttle: 100,
  })

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const [input, setInput] = useState('')

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
        sendMessage={sendMessage}
        scrollToBottom={scrollToBottom}
        disabled={isLoading}
      />
    </>
  )
}
