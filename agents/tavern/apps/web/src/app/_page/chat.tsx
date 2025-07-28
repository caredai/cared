import assert from 'assert'
import type { Message, MessageContent, MessageMetadata, MessageNode, UIMessage } from '@tavern/core'
import type { PrepareSendMessagesRequest } from 'ai'
import type { ScrollToIndexAlign, VListHandle } from 'virtua'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Chat as AIChat, useChat } from '@ai-sdk/react'
import { buildPromptMessages, toUIMessages } from '@tavern/core'
import { DefaultChatTransport } from 'ai'

import { generateMessageId } from '@ownxai/sdk'

import { CircleSpinner } from '@/components/spinner'
import { useActivateCharacters, useActivatedCharacters } from '@/hooks/use-activate-characters'
import { useActive } from '@/hooks/use-active'
import { isCharacterGroup } from '@/hooks/use-character-or-group'
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

  const { branch, branchRef, navigate, update, isLoading, hasNextPage, refetch, isChatLoading } =
    useBuildMessageTree()

  const createMessage = useCreateMessage(chatId)
  const updateMessage = useUpdateMessage(chatId)
  const { addCachedMessage, updateCachedMessage, deleteCachedMessage: _ } = useCachedMessage(chat)

  const generatingMessageIdRef = useRef('')
  const { startTimer, stopTimer, elapsedSeconds } = useGeneratingTimer()

  useActivateCharacters()
  const { nextActivatedCharacter, advanceActivatedCharacter } = useActivatedCharacters()

  const prepareSendMessagesRequest = useCallback(
    async ({
      id,
      messages: uiMessages,
      trigger,
      body,
      requestMetadata,
    }: Parameters<PrepareSendMessagesRequest<UIMessage>>[0]) => {
      if (!chat || !model || !persona || !charOrGroup) {
        throw new Error('Not initialized')
      }

      const uiMessage = uiMessages.at(-1)
      if (!uiMessage) {
        throw new Error('No messages')
      }

      const { generateType } = (requestMetadata ?? {}) as {
        generateType?: 'continue' | 'impersonate'
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

            if (generateType === 'impersonate') {
              lastMessage = {
                ...lastMessage,
                role: 'assistant',
              }
            }

            if (lastMessage.role === 'assistant') {
              isContinuation = true

              generatingMessageIdRef.current = lastMessage.id
            }

            if (trigger === 'submit-tool-result') {
              assert.equal(
                lastMessage.role,
                'assistant',
                'Last message must be an assistant message for `submit-tool-result`',
              )
            }

            if (
              trigger === 'regenerate-assistant-message' &&
              lastMessage.role === 'assistant' &&
              generateType !== 'continue'
            ) {
              // Do not include the last assistant message
              messages = messages.slice(0, nodeIndex)
            } else {
              messages = messages.slice(0, nodeIndex + 1)
            }
          }
          break
      }

      // console.log('lastMessage.id', lastMessage.id, 'messages', messages)

      const nextChar = nextActivatedCharacter()
      if (!nextChar) {
        throw new Error('No character')
      }

      const { promptMessages } = await buildPromptMessages({
        generateType: generateType ?? 'normal',
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
          generateType,
          deleteTrailing,
          characterId: nextChar.id,
          characterName: nextChar.content.data.name,
          personaId: persona.id,
          personaName: persona.name,
          modelId: model.id,
          ...body,
        },
      }
    },
    [
      branchRef,
      charOrGroup,
      chat,
      lorebooks,
      model,
      modelPreset,
      nextActivatedCharacter,
      persona,
      settings,
      startTimer,
    ],
  )

  const prepareSendMessagesRequestRef = useRef(prepareSendMessagesRequest)
  useEffect(() => {
    prepareSendMessagesRequestRef.current = prepareSendMessagesRequest
  }, [prepareSendMessagesRequest])

  const nextRef = useRef<() => void>(null)

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
      if (!message.metadata?.personaId) {
        // !== impersonate
        const hasNextActivated = advanceActivatedCharacter()
        if (hasNextActivated) {
          nextRef.current?.()
        }
      }
      console.log('onFinish, message:', message, 'generationSeconds:', generationSeconds)
    },
    [stopTimer, update, updateMessage, advanceActivatedCharacter],
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
      void refetch()
    },
    [stopTimer, refetch],
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
    experimental_throttle: 100,
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
    async (node?: MessageNode) => {
      if (!node) {
        node = branchRef.current.at(-1)
        if (!node) {
          return
        }
      }
      if (!model || node.message.role !== 'assistant' || !node.parent.message) {
        return
      }

      const { characterId, characterName, excluded } = node.message.content.metadata

      const newMessage = {
        ...node.message,
        content: {
          parts: [],
          metadata: {
            characterId,
            characterName,
            modelId: model.id,
            excluded,
          },
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
    [branchRef, model, setMessages, updateMessage],
  )

  const swipe = useCallback(
    (node: MessageNode) => {
      if (!model || node !== node.parent.descendants.at(-1) || !node.parent.message) {
        return
      }
      const {
        personaId,
        personaName,
        characterId,
        characterName,
        // Omit `summary` from metadata,
        // since the content of this message will be changed, and the summary will be invalid
        summary: _,
      } = node.message.content.metadata
      const metadata: MessageMetadata = {
        personaId,
        personaName,
        characterId,
        characterName,
        modelId: model.id,
      }

      const newMessage = {
        id: generateMessageId(),
        parentId: node.message.parentId ?? undefined,
        role: node.message.role,
        content: {
          parts: node.message.role === 'user' ? node.message.content.parts : [],
          metadata,
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
        }
      })

      if (node.message.role === 'user') {
        setEditMessageId(newMessage.id)
      }
    },
    [createMessage, model, navigate, setMessages],
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

  const next = useCallback(() => {
    const lastMessage = branchRef.current.at(-1)?.message
    const nextChar = nextActivatedCharacter()
    if (!nextChar || !model) {
      return
    }

    const metadata: MessageMetadata = {
      characterId: nextChar.id,
      characterName: nextChar.content.data.name,
      modelId: model.id,
    }

    const newMessage = {
      id: generateMessageId(),
      parentId: lastMessage?.id ?? undefined,
      role: 'assistant' as const,
      content: {
        parts: [],
        metadata,
      },
    }

    void createMessage(newMessage).then(() => {
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
    })
  }, [branchRef, createMessage, model, nextActivatedCharacter, setMessages])

  useEffect(() => {
    nextRef.current = next
  }, [next])

  const submit = useCallback(
    (input: string) => {
      const lastMessage = branchRef.current.at(-1)?.message
      if (input) {
        void chatRef.current.sendMessage({
          role: 'user',
          parts: [{ type: 'text', text: input.trim() }],
        })
      } else if (lastMessage?.role === 'user') {
        setMessages(toUIMessages([lastMessage]))
        void chatRef.current.regenerate()
      } else if (modelPreset.utilityPrompts.sendIfEmpty.trim()) {
        void chatRef.current.sendMessage({
          role: 'user',
          parts: [{ type: 'text', text: modelPreset.utilityPrompts.sendIfEmpty.trim() }],
        })
      } else {
        next()
      }
    },
    [branchRef, modelPreset.utilityPrompts.sendIfEmpty, next, setMessages],
  )

  const continue_ = useCallback(async () => {
    const node = branchRef.current.at(-1)
    if (
      !model ||
      node?.message.role !== 'assistant' ||
      !node.parent.message ||
      node.message.content.metadata.excluded
    ) {
      return
    }

    const { characterId, characterName, excluded } = node.message.content.metadata

    const newMessage = {
      ...node.message,
      content: {
        parts: node.message.content.parts,
        metadata: {
          characterId,
          characterName,
          modelId: model.id,
          excluded,
        },
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

    void chatRef.current.regenerate({
      metadata: {
        generateType: 'continue',
      },
    })
  }, [branchRef, model, setMessages, updateMessage])

  const impersonate = useCallback(() => {
    const lastMessage = branchRef.current.at(-1)?.message
    if (!persona || !model) {
      return
    }

    const metadata: MessageMetadata = {
      personaId: persona.id,
      personaName: persona.name,
      modelId: model.id,
    }

    const newMessage = {
      id: generateMessageId(),
      parentId: lastMessage?.id ?? undefined,
      role: 'user' as const,
      content: {
        parts: [],
        metadata,
      },
    }

    void createMessage(newMessage).then(() => {
      // regenerate() will remove the last assistant message, so we add a pseudo message
      const pseudoMessage = {
        ...structuredClone(newMessage),
        id: generateMessageId(),
        parentId: newMessage.id,
        role: 'assistant' as const,
      }
      pseudoMessageIdRef.current = pseudoMessage.id
      setMessages(
        toUIMessages([
          newMessage,
          pseudoMessage,
        ]),
      )

      void chatRef.current.regenerate({
        metadata: {
          generateType: 'impersonate',
        },
      })
    })
  }, [branchRef, createMessage, model, persona, setMessages])

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
        chatRef={chatRef}
        status={status}
        messages={branch}
        setMessages={setMessages}
        disabled={isLoading}
        submit={submit}
        regenerate={refresh}
        impersonate={impersonate}
        continue_={continue_}
      />
    </>
  )
}
