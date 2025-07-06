import type { Character } from '@/hooks/use-character'
import type { Message, MessageContent, MessageMetadata, MessageNode, UIMessage } from '@tavern/core'
import type { PrepareSendMessagesRequest } from 'ai'
import type { VListHandle } from 'virtua'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Chat as AIChat, useChat } from '@ai-sdk/react'
import { buildPromptMessages } from '@tavern/core'
import { DefaultChatTransport } from 'ai'

import { generateMessageId } from '@ownxai/sdk'

import { CircleSpinner } from '@/components/spinner'
import { useActive } from '@/hooks/use-active'
import { isCharacter, isCharacterGroup } from '@/hooks/use-character-or-group'
import { useCachedMessage, useCreateMessage, useUpdateMessage } from '@/hooks/use-message'
import { useBuildMessageTree } from '@/hooks/use-message-tree'
import { ContentArea } from './content-area'
import { useCallWhenGenerating } from './hooks'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'
import { fetchWithErrorHandlers } from './utils'

export function Chat() {
  const { settings, modelPreset, model, charOrGroup, persona, chat } = useActive()

  const chatId = chat?.id

  const { branch, branchRef, navigate, isLoading, isSuccess, hasNextPage, isChatLoading } =
    useBuildMessageTree()

  const { addCachedMessage, updateCachedMessage } = useCachedMessage(chat)

  const buildNewBranch = useCallback(
    (uiMessages: UIMessage[], nextCharacter?: Character) => {
      if (!chat || !model || !persona || !charOrGroup) {
        throw new Error('Not initialized')
      }

      const newUiMessage = uiMessages.at(-1)
      if (!newUiMessage) {
        throw new Error('No messages')
      }

      const lastNode = branchRef.current.at(-1)
      const lastMessage = lastNode?.message
      const newBranch = [...branchRef.current]
      let newLastMessage
      let isAdd

      const metadata: MessageMetadata =
        newUiMessage.role === 'user'
          ? {
              personaId: persona.id,
              personaName: persona.name,
            }
          : {
              characterId: nextCharacter?.id,
              modelId: model.id,
            }

      if (newUiMessage.id === lastMessage?.id) {
        newLastMessage = {
          ...lastMessage,
          content: {
            parts: newUiMessage.parts,
            metadata: (newUiMessage as any).metadata ?? lastMessage.content.metadata ?? metadata,
          },
        }
        newBranch[newBranch.length - 1]!.message = newLastMessage
        isAdd = false
      } else {
        newLastMessage = {
          id: newUiMessage.id,
          chatId: chat.id,
          parentId: lastMessage?.id ?? null,
          role: newUiMessage.role,
          content: {
            parts: newUiMessage.parts,
            metadata: (newUiMessage as any).metadata ?? metadata,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Message
        newBranch.push({
          message: newLastMessage,
          parent: lastNode ?? { descendants: [] },
          descendants: [],
        })
        isAdd = true
      }

      return {
        branch: newBranch,
        lastMessage: newLastMessage,
        isAdd,
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [charOrGroup, chat, model, persona],
  )

  const prepareSendMessagesRequest = useCallback(
    ({
      id,
      messages: uiMessages,
      trigger,
      body,
    }: Parameters<PrepareSendMessagesRequest<UIMessage>>[0]) => {
      if (!chat || !model || !persona || !charOrGroup) {
        throw new Error('Not initialized')
      }

      // TODO
      const nextChar = isCharacter(charOrGroup) ? charOrGroup : charOrGroup.characters[0]
      if (!nextChar) {
        throw new Error('No character')
      }

      const { branch, lastMessage } = buildNewBranch(uiMessages, nextChar)

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
        body: {
          id,
          messages: promptMessages,
          lastMessage,
          characterId: nextChar.id,
          modelId: model.id,
          ...body,
        },
      }
    },
    [buildNewBranch, charOrGroup, chat, model, modelPreset, persona, settings],
  )

  const prepareSendMessagesRequestRef = useRef(prepareSendMessagesRequest)
  useEffect(() => {
    prepareSendMessagesRequestRef.current = prepareSendMessagesRequest
  }, [prepareSendMessagesRequest])

  const chatRef = useRef(
    new AIChat({
      id: chatId,
      generateId: generateMessageId,
      transport: new DefaultChatTransport({
        api: '/api/chat',
        fetch: fetchWithErrorHandlers,
        prepareSendMessagesRequest: (args: Parameters<PrepareSendMessagesRequest<UIMessage>>[0]) =>
          prepareSendMessagesRequestRef.current(args),
      }),
      onFinish: (...args) => console.log('onFinish', ...args),
      onError: (error) => console.error('onError', error),
    }),
  )

  useEffect(() => {
    ;(chatRef.current as any).id = chatId
  }, [chatId])

  const onMessagesChange = useCallback(() => {
    const { lastMessage, isAdd } = buildNewBranch(chatRef.current.messages)
    if (isAdd) {
      void addCachedMessage(lastMessage)
    } else {
      void updateCachedMessage(lastMessage)
    }
  }, [addCachedMessage, updateCachedMessage, buildNewBranch])

  useEffect(() => {
    return chatRef.current['~registerMessagesCallback'](onMessagesChange, 100)
  }, [onMessagesChange])

  const { setMessages, status } = useChat<UIMessage>({
    chat: chatRef.current,
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
        setTimeout(scrollToBottom, 3)
      }
    }, [scrollToBottom, branch]),
  )

  const [input, setInput] = useState('')

  const [editMessageId, setEditMessageId] = useState('')

  const createMessage = useCreateMessage(chatId)
  const updateMessage = useUpdateMessage(chatId)

  const swipe = useCallback(
    (node: MessageNode) => {
      if (!chatId) {
        return
      }
      if (node !== node.parent.descendants.at(-1)) {
        return
      }
      const { personaId, personaName, characterId, modelId, summary } =
        node.message.content.metadata
      const metadata: MessageMetadata = {
        personaId,
        personaName,
        characterId,
        modelId,
        summary,
      }

      const id = generateMessageId()

      void createMessage({
        id,
        parentId: node.message.parentId ?? undefined,
        role: node.message.role,
        content: {
          parts: [
            {
              type: 'text',
              text: '',
            },
          ],
          metadata: metadata,
        },
      })

      setEditMessageId(id)
    },
    [chatId, createMessage],
  )

  const edit = useCallback(
    (node: MessageNode, content: MessageContent) => {
      void updateMessage(node.message.id, content)
    },
    [updateMessage],
  )

  return (
    <>
      <ContentArea>
        {(isChatLoading || isLoading || hasNextPage) /* TODO */ && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <CircleSpinner />
          </div>
        )}
        <Messages
          ref={ref}
          endRef={endRef}
          chatRef={chatRef}
          chatId={chatId}
          messages={branch}
          status={status}
          navigate={navigate}
          swipe={swipe}
          edit={edit}
          editMessageId={editMessageId}
          setEditMessageId={setEditMessageId}
        />
      </ContentArea>

      <MultimodalInput
        input={input}
        setInput={setInput}
        messagesRef={branchRef}
        chatRef={chatRef}
        status={status}
        setMessages={setMessages}
        scrollToBottom={scrollToBottom}
        disabled={isLoading}
      />
    </>
  )
}
