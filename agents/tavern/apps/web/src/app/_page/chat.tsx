import assert from 'assert'
import type { Message, MessageContent, MessageMetadata, MessageNode, UIMessage } from '@tavern/core'
import type { PrepareSendMessagesRequest } from 'ai'
import type { ScrollToIndexAlign, VListHandle } from 'virtua'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Chat as AIChat, useChat } from '@ai-sdk/react'
import { activateCharactersFromGroup, buildPromptMessages, toUIMessages } from '@tavern/core'
import { DefaultChatTransport } from 'ai'

import { generateMessageId } from '@ownxai/sdk'

import { CircleSpinner } from '@/components/spinner'
import { useActive } from '@/hooks/use-active'
import { isCharacter, isCharacterGroup } from '@/hooks/use-character-or-group'
import { useCachedMessage, useCreateMessage, useUpdateMessage } from '@/hooks/use-message'
import { useBuildMessageTree } from '@/hooks/use-message-tree'
import { countTokens } from '@/lib/tokenizer'
import { ContentArea } from './content-area'
import { useGeneratingTimer } from './hooks'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'
import { fetchWithErrorHandlers } from './utils'

export function Chat() {
  const { settings, modelPreset, model, charOrGroup, persona, chat, lorebooks } = useActive()

  const chatId = chat?.id

  const { branch, branchRef, navigate, update, isLoading, hasNextPage, isChatLoading } =
    useBuildMessageTree()

  const createMessage = useCreateMessage(chatId)
  const updateMessage = useUpdateMessage(chatId)
  const { addCachedMessage, updateCachedMessage, deleteCachedMessage: _ } = useCachedMessage(chat)

  const generatingMessageIdRef = useRef('')
  const { startTimer, stopTimer, elapsedSeconds } = useGeneratingTimer()

  const prepareSendMessagesRequest = useCallback(
    async ({
      id,
      messages: uiMessages,
      trigger,
      body,
    }: Parameters<PrepareSendMessagesRequest<UIMessage>>[0]) => {
      if (!chat || !model || !persona || !charOrGroup) {
        throw new Error('Not initialized')
      }

      const uiMessage = uiMessages.at(-1)
      if (!uiMessage) {
        throw new Error('No messages')
      }

      const nodeIndex = branchRef.current.findIndex((node) => node.message.id === uiMessage.id)
      const node = nodeIndex >= 0 ? branchRef.current[nodeIndex] : undefined

      let messages = [...branchRef.current]

      let lastMessage
      let isLastNew = false
      let isContinuation = false
      const deleteTrailing = false

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

              messages.push({
                message: lastMessage,
                parent: lastNode ?? { descendants: [] },
                descendants: [],
              })
            } else {
              lastMessage = {
                ...node.message,
                content: {
                  parts: uiMessage.parts,
                  metadata: node.message.content.metadata,
                },
              }

              messages = messages.slice(0, nodeIndex + 1)
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

            if (trigger === 'regenerate-assistant-message' && lastMessage.role === 'assistant') {
              messages = messages.slice(0, nodeIndex)

              generatingMessageIdRef.current = lastMessage.id
            } else {
              messages = messages.slice(0, nodeIndex + 1)

              if (trigger === 'submit-tool-result') {
                generatingMessageIdRef.current = lastMessage.id
              }
            }
          }
          break
      }

      // console.log('lastMessage.id', lastMessage.id, 'messages', messages)

      // TODO
      const nextChar = isCharacter(charOrGroup)
        ? charOrGroup
        : activateCharactersFromGroup({
            group: charOrGroup,
            messages,
            impersonate: false, // TODO
          })[0]
      if (!nextChar) {
        throw new Error('No character')
      }

      const { promptMessages } = await buildPromptMessages({
        generateType: 'normal',
        messages: messages, // TODO
        chat,
        settings,
        modelPreset,
        model,
        persona,
        character: nextChar,
        group: isCharacterGroup(charOrGroup) ? charOrGroup : undefined,
        lorebooks,
        countTokens,
        log: true,
      })

      startTimer()

      return {
        body: {
          id,
          messages: promptMessages,
          lastMessage,
          isLastNew,
          isContinuation,
          deleteTrailing,
          characterId: nextChar.id,
          characterName: nextChar.content.data.name,
          modelId: model.id,
          ...body,
        },
      }
    },
    [branchRef, charOrGroup, chat, lorebooks, model, modelPreset, persona, settings, startTimer],
  )

  const prepareSendMessagesRequestRef = useRef(prepareSendMessagesRequest)
  useEffect(() => {
    prepareSendMessagesRequestRef.current = prepareSendMessagesRequest
  }, [prepareSendMessagesRequest])

  const onFinish = useCallback(
    (message: UIMessage) => {
      const generationSeconds = stopTimer()
      update(message.id, (message) => ({
        ...message,
        content: {
          ...message.content,
          metadata: {
            ...message.content.metadata,
            generationSeconds,
          },
        },
      }))
      void updateMessage(message.id, {
        parts: message.parts,
        metadata: {
          ...message.metadata,
          generationSeconds,
        },
      })
      generatingMessageIdRef.current = ''
      console.log('onFinish, message:', message, 'generationSeconds:', generationSeconds)
    },
    [update, updateMessage, stopTimer],
  )

  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const onError = useCallback(
    (error: Error) => {
      generatingMessageIdRef.current = ''
      stopTimer()
      console.error('onError', error)
    },
    [stopTimer],
  )

  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

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
      onFinish: ({ message }) => onFinishRef.current(message),
      onError: (error) => onErrorRef.current(error),
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
    if (pseudoMessageIdRef.current && lastUIMessage?.id === pseudoMessageIdRef.current) {
      lastUIMessage = chatRef.current.messages.at(-2)
    }
    if (!lastUIMessage) {
      throw new Error('No messages')
    }

    const foundNode = branchRef.current.find((node) => node.message.id === lastUIMessage.id)
    // console.log('lastUIMessage.id', lastUIMessage.id, 'foundNode.message.id', foundNode?.message.id)

    if (!foundNode) {
      const parentId = branchRef.current.at(-1)?.message.id

      if (lastUIMessage.role === 'assistant') {
        generatingMessageIdRef.current = lastUIMessage.id
      }

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
      /* if (foundNode.descendants.length) {
        void deleteCachedMessage(lastUIMessage.id)
      } */

      const newLastMessage = {
        ...foundNode.message,
        content: {
          parts: lastUIMessage.parts,
          metadata: {
            ...lastUIMessage.metadata,
            ...foundNode.message.content.metadata,
            ...(lastUIMessage.role === 'assistant' && { generationSeconds: elapsedSeconds }),
          },
        },
      }

      void updateCachedMessage(newLastMessage)
    }
  }, [addCachedMessage, updateCachedMessage, branchRef, chat, persona, elapsedSeconds])

  const onMessagesChangeRef = useRef(onMessagesChange)
  useEffect(() => {
    onMessagesChangeRef.current = onMessagesChange
  }, [onMessagesChange])

  useEffect(() => {
    return chatRef.current['~registerMessagesCallback'](() => onMessagesChangeRef.current())
  }, [])

  const { setMessages, status } = useChat<UIMessage>({
    chat: chatRef.current,
  })

  const ref = useRef<VListHandle>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const scrollTo = useCallback(
    (
      index?: number,
      {
        align = 'end',
        smooth = true,
      }: {
        align?: ScrollToIndexAlign
        smooth?: boolean
      } = { align: 'end', smooth: true },
    ) => {
      // There always exists a `div` at the end of the list, so we can scroll to it.
      const targetIndex = typeof index !== 'number' ? branchRef.current.length : index
      ref.current?.scrollToIndex(targetIndex, {
        align,
        // Using smooth scrolling over many items can kill performance benefit of virtual scroll.
        smooth,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [input, setInput] = useState('')

  const [editMessageId, setEditMessageId] = useState('')

  const pseudoMessageIdRef = useRef('')

  const refresh = useCallback(
    async (node: MessageNode) => {
      if (node.message.role !== 'assistant' || !node.parent.message) {
        return
      }

      const newMessage = {
        ...node.message,
        content: {
          parts: [],
          metadata: node.message.content.metadata,
        },
      }

      await updateMessage(node.message.id, newMessage.content)

      // regenerate() will remove the last assistant message, so we add a pseudo message
      const pseudoMessage = {
        ...structuredClone(newMessage),
        id: generateMessageId(),
        parentId: newMessage.id,
      }
      pseudoMessageIdRef.current = pseudoMessage.id
      setMessages(
        toUIMessages([
          newMessage,
          pseudoMessage,
        ]),
      )

      void chatRef.current.regenerate()
    },
    [setMessages, updateMessage],
  )

  const swipe = useCallback(
    (node: MessageNode) => {
      if (node !== node.parent.descendants.at(-1) || !node.parent.message) {
        return
      }
      const { personaId, personaName, characterId, characterName, modelId, summary } =
        node.message.content.metadata
      const metadata: MessageMetadata = {
        personaId,
        personaName,
        characterId,
        characterName,
        modelId,
        summary, // TODO
      }

      const newMessage = {
        id: generateMessageId(),
        parentId: node.message.parentId ?? undefined,
        role: node.message.role,
        content: {
          parts: node.message.role === 'user' ? node.message.content.parts : [],
          metadata: metadata,
        },
      }

      setTimeout(() => navigate(node.message.id, false), 10)

      void createMessage(newMessage).then(() => {
        navigate(node.message.id, false)

        if (node.message.role === 'assistant') {
          // regenerate() will remove the last assistant message, so we add a pseudo message
          const pseudoMessage = {
            ...structuredClone(newMessage),
            id: generateMessageId(),
            parentId: newMessage.parentId ?? undefined,
          }
          pseudoMessageIdRef.current = pseudoMessage.id
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
    [createMessage, navigate, setMessages],
  )

  const edit = useCallback(
    async (node: MessageNode, content: MessageContent, regenerate: boolean) => {
      await updateMessage(node.message.id, content)

      setTimeout(() => {
        if (regenerate) {
          const message = branchRef.current.find((m) => m.message.id === node.message.id)?.message
          if (!message) {
            return
          }
          setMessages(toUIMessages([message]))
          void chatRef.current.regenerate()
        }
      }, 0)
    },
    [branchRef, setMessages, updateMessage],
  )

  return (
    <>
      <ContentArea>
        {isChatLoading || isLoading || hasNextPage /* TODO */ ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <CircleSpinner />
          </div>
        ) : (
          <Messages
            ref={ref}
            endRef={endRef}
            chatRef={chatRef}
            chatId={chatId}
            messages={branch}
            status={status}
            navigate={navigate}
            refresh={refresh}
            swipe={swipe}
            edit={edit}
            editMessageId={editMessageId}
            setEditMessageId={setEditMessageId}
            scrollTo={scrollTo}
            generatingMessageId={generatingMessageIdRef.current}
            elapsedSeconds={elapsedSeconds}
          />
        )}
      </ContentArea>

      <MultimodalInput
        input={input}
        setInput={setInput}
        messagesRef={branchRef}
        chatRef={chatRef}
        status={status}
        setMessages={setMessages}
        disabled={isLoading}
      />
    </>
  )
}
