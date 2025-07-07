import assert from 'assert'
import type { Message, MessageContent, MessageMetadata, MessageNode, UIMessage } from '@tavern/core'
import type { PrepareSendMessagesRequest } from 'ai'
import type { VListHandle } from 'virtua'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Chat as AIChat, useChat } from '@ai-sdk/react'
import { buildPromptMessages, toUIMessages } from '@tavern/core'
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

  const { addCachedMessage, updateCachedMessage, deleteCachedMessage } = useCachedMessage(chat)

  const prepareSendMessagesRequest = useCallback(
    ({ id, messages, trigger, body }: Parameters<PrepareSendMessagesRequest<UIMessage>>[0]) => {
      if (!chat || !model || !persona || !charOrGroup) {
        throw new Error('Not initialized')
      }

      const uiMessage = messages.at(-1)
      if (!uiMessage) {
        throw new Error('No messages')
      }

      const nodeIndex = branchRef.current.findIndex((node) => node.message.id === uiMessage.id)
      const node = nodeIndex >= 0 ? branchRef.current[nodeIndex] : undefined

      let newBranch = [...branchRef.current]

      let lastMessage
      let isLastNew = false
      let isContinuation = false
      const deleteTrailing = !!node?.descendants.length

      switch (trigger) {
        case 'submit-user-message':
          {
            assert.equal(uiMessage.role, 'user')

            if (!node) {
              const lastNode = branchRef.current.at(-1)
              const parentId = lastNode?.message.id

              isLastNew = true

              lastMessage = {
                id: uiMessage.id,
                chatId: chat.id,
                parentId: parentId ?? null,
                role: uiMessage.role,
                content: {
                  parts: uiMessage.parts,
                  metadata: uiMessage.metadata ?? {
                    personaId: persona.id,
                    personaName: persona.name,
                  },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              } as Message

              newBranch.push({
                message: lastMessage,
                parent: lastNode ?? { descendants: [] },
                descendants: [],
              })
            } else {
              lastMessage = {
                ...node.message,
                content: {
                  parts: uiMessage.parts,
                  metadata: uiMessage.metadata ?? node.message.content.metadata,
                },
              }

              newBranch = newBranch.slice(0, nodeIndex + 1)
            }
          }
          break
        case 'regenerate-assistant-message':
        case 'submit-tool-result': // fallthrough
          {
            if (!node) {
              throw new Error(`Message with id ${uiMessage.id} not found`)
            }
            lastMessage = node.message

            if (lastMessage.role === 'assistant') {
              isContinuation = true
            }

            newBranch = newBranch.slice(0, nodeIndex + 1)
          }
          break
      }

      // TODO
      const nextChar = isCharacter(charOrGroup) ? charOrGroup : charOrGroup.characters[0]
      if (!nextChar) {
        throw new Error('No character')
      }

      const promptMessages = buildPromptMessages({
        messages: newBranch, // TODO
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
          isLastNew,
          isContinuation,
          deleteTrailing,
          characterId: nextChar.id,
          modelId: model.id,
          ...body,
        },
      }
    },
    [branchRef, charOrGroup, chat, model, modelPreset, persona, settings],
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
    if (!chat || !persona) {
      throw new Error('Not initialized')
    }

    let lastUIMessage = chatRef.current.messages.at(-1)
    if (pseudoMessageId && lastUIMessage?.id === pseudoMessageId) {
      lastUIMessage = chatRef.current.messages.at(-2)
    }
    if (!lastUIMessage) {
      throw new Error('No messages')
    }

    const foundNode = branchRef.current.find((node) => node.message.id === lastUIMessage.id)

    if (!foundNode) {
      const parentId = branchRef.current.at(-1)?.message.id

      const newLastMessage = {
        id: lastUIMessage.id,
        chatId: chat.id,
        parentId: parentId ?? null,
        role: lastUIMessage.role,
        content: {
          parts: lastUIMessage.parts,
          metadata:
            (lastUIMessage.metadata ?? lastUIMessage.role === 'user')
              ? {
                  personaId: persona.id,
                  personaName: persona.name,
                }
              : // should never happen
                {},
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Message

      void addCachedMessage(newLastMessage)
    } else {
      if (foundNode.descendants.length) {
        void deleteCachedMessage(lastUIMessage.id)
      }

      const newLastMessage = {
        ...foundNode.message,
        content: {
          parts: lastUIMessage.parts,
          metadata: lastUIMessage.metadata ?? foundNode.message.content.metadata,
        },
      }

      void updateCachedMessage(newLastMessage)
    }
  }, [addCachedMessage, updateCachedMessage, deleteCachedMessage, branchRef, chat, persona])

  const onMessagesChangeRef = useRef(onMessagesChange)
  useEffect(() => {
    onMessagesChangeRef.current = onMessagesChange
  }, [onMessagesChange])

  useEffect(() => {
    return chatRef.current['~registerMessagesCallback'](() => onMessagesChangeRef.current(), 100)
  }, [])

  const { setMessages, status } = useChat<UIMessage>({
    chat: chatRef.current,
    experimental_throttle: 100,
  })

  const ref = useRef<VListHandle>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const scrollTo = useCallback((index?: number | 'bottom', smooth?: boolean) => {
    // There always exists a `div` at the end of the list, so we can scroll to it.
    const targetIndex = typeof index !== 'number' ? branchRef.current.length : index
    ref.current?.scrollToIndex(targetIndex, {
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
      scrollTo('bottom', false)
      setShouldScrollToBottom(false)
    }
  }, [scrollTo, shouldScrollToBottom])

  useCallWhenGenerating(
    chatId,
    status,
    useCallback(() => {
      // Always scroll to bottom when the message list changes.
      if (branch.length) {
        setTimeout(scrollTo, 3)
      }
    }, [scrollTo, branch]),
  )

  const [input, setInput] = useState('')

  const [editMessageId, setEditMessageId] = useState('')

  const createMessage = useCreateMessage(chatId)
  const updateMessage = useUpdateMessage(chatId)

  const [pseudoMessageId, setPseudoMessageId] = useState('')

  const swipe = useCallback(
    (node: MessageNode) => {
      if (!chatId) {
        return
      }
      if (node !== node.parent.descendants.at(-1) || !node.parent.message) {
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

      const newMessage = {
        id: generateMessageId(),
        parentId: node.message.parentId ?? undefined,
        role: node.message.role,
        content: {
          parts: [
            {
              type: 'text' as const,
              text: '',
            },
          ],
          metadata: metadata,
        },
      }

      void createMessage(newMessage).then(() => {
        if (node.message.role === 'assistant') {
          // regenerate() will remove the last assistant message, so we add a pseudo message
          const pseudoMessage = {
            ...structuredClone(newMessage),
            id: generateMessageId(),
            parentId: newMessage.parentId ?? undefined,
          }
          setPseudoMessageId(pseudoMessage.id)
          setMessages(
            toUIMessages([
              newMessage,
              pseudoMessage,
            ]),
          )

          void chatRef.current.regenerate()
        }
      })

      if (node.message.role === 'user') {
        setEditMessageId(newMessage.id)
      }
    },
    [chatId, createMessage, setMessages],
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
          scrollTo={scrollTo}
        />
      </ContentArea>

      <MultimodalInput
        input={input}
        setInput={setInput}
        messagesRef={branchRef}
        chatRef={chatRef}
        status={status}
        setMessages={setMessages}
        scrollToBottom={scrollTo}
        disabled={isLoading}
      />
    </>
  )
}
