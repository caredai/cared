import type { Message, MessageContent } from '@tavern/core'
import type { UIMessage } from 'ai'
import type { VListHandle } from 'virtua'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { buildPromptMessages } from '@tavern/core'
import hash from 'stable-hash'

import { generateMessageId } from '@ownxai/sdk'

import type { MessageNode } from './messages'
import { MultimodalInput } from '@/app/_page/multimodal-input'
import {
  isCharacter,
  isCharacterGroup,
  useActiveCharacterOrGroup,
} from '@/hooks/use-character-or-group'
import { useCachedMessage, useMessages } from '@/hooks/use-message'
import { useActiveLanguageModel } from '@/hooks/use-model'
import { useCustomizeModelPreset } from '@/hooks/use-model-preset'
import { useActivePersona } from '@/hooks/use-persona'
import { useSettings } from '@/hooks/use-settings'
import { ContentArea } from './content-area'
import { buildMessageTree, Messages } from './messages'

export function Chat({ id }: { id?: string }) {
  const { data, isLoading, isSuccess, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(id)

  useEffect(() => {
    void (async function () {
      if (hasNextPage && !isFetchingNextPage && !isLoading) {
        try {
          await fetchNextPage()
        } catch (error) {
          console.error('fetch next page of messages', error)
        }
      }
    })()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading])

  const tree = useMemo(
    () =>
      isSuccess && !hasNextPage
        ? buildMessageTree(data.pages.flatMap((page) => page.messages))
        : null,
    [data, hasNextPage, isSuccess],
  )

  const [branch, setBranch] = useState<MessageNode[]>()

  useEffect(() => {
    if (tree === null) {
      return
    }
    if (!tree) {
      setBranch([])
      return
    }
    const nodes: MessageNode[] = []
    let current: MessageNode | undefined = tree.latest
    while (current) {
      nodes.push(current)
      current = current.parent
    }
    setBranch(nodes.reverse())
  }, [tree])

  const navigate = useCallback((current: MessageNode, previous: boolean) => {
    const index = current.parent?.descendants.findIndex((m) => m === current)
    if (index === undefined || index < 0) {
      return
    }
    const newIndex = previous ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= (current.parent?.descendants.length ?? 0)) {
      return
    }
    const newCurrent = current.parent?.descendants[newIndex]
    if (!newCurrent) {
      return
    }
    setBranch((branch) => {
      if (!branch) {
        return branch
      }
      const position = branch.findIndex((m) => m === current)
      if (position < 0) {
        return branch
      }
      const newBranch = [...branch.slice(0, position)]
      let next: MessageNode | undefined = newCurrent
      while (next) {
        newBranch.push(next)
        next = next.descendants.reduce((latest, node) => {
          return !latest || latest.message.id < node.message.id ? node : latest
        }, next.descendants[0])
      }
      return newBranch
    })
  }, [])

  const settings = useSettings()
  const { activeCustomizedPreset: modelPreset } = useCustomizeModelPreset()
  const { activeLanguageModel: model } = useActiveLanguageModel()
  const charOrGroup = useActiveCharacterOrGroup()
  const { activePersona: persona } = useActivePersona()

  const { addCachedMessage, updateCachedMessage } = useCachedMessage(id)

  const prepareRequestBody = useCallback(
    ({ id, messages: uiMessages }: { id: string; messages: UIMessage[] }) => {
      if (!branch || !model) {
        throw new Error('Message branch is not initialized')
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
                : charOrGroup?.characters[0]?.id,
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
              personaId: persona?.id,
              personaName: persona?.name,
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

      const promptMessages = buildPromptMessages({
        messages,
        settings,
        modelPreset,
        model,
        character: isCharacter(charOrGroup) ? charOrGroup.content : undefined,
        group: isCharacterGroup(charOrGroup)
          ? {
              characters: charOrGroup.characters.map((c) => c.content),
              metadata: charOrGroup.metadata,
            }
          : undefined,
      })

      return {
        id,
        messages: promptMessages,
        lastMessage,
        characterId: '',
        modelId: model.id,
      }
    },
    [branch, charOrGroup, model, modelPreset, settings, addCachedMessage, updateCachedMessage],
  )

  const { messages, setMessages, handleSubmit, input, setInput, append, status, stop } = useChat({
    id,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateMessageId,
    experimental_prepareRequestBody: prepareRequestBody,
    onFinish: (...args) => console.log('onFinish', ...args),
    onError: (error) => console.error('onError', error),
  })

  useEffect(() => {
    if (!branch) {
      return
    }
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
        chatId: id,
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
  }, [branch, messages, persona, charOrGroup, model, id, addCachedMessage, updateCachedMessage])

  const ref = useRef<VListHandle>(null)

  const scrollToBottom = useCallback(() => {
    if (!branch?.length) {
      return
    }
    ref.current?.scrollToIndex(branch.length - 1, {
      align: 'end',
      // Using smooth scrolling over many items can kill performance benefit of virtual scroll.
      smooth: false,
    })
  }, [branch?.length])

  return (
    <>
      <ContentArea>
        {isSuccess && branch && <Messages ref={ref} messages={branch} navigate={navigate} />}
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
