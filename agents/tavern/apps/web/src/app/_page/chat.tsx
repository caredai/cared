import type { ReducedMessage } from '@tavern/core'
import type { UIMessage, Message } from 'ai'
import type { VListHandle } from 'virtua'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { buildPromptMessages } from '@tavern/core'

import { generateMessageId } from '@ownxai/sdk'

import type { MessageNode } from './messages'
import { MultimodalInput } from '@/app/_page/multimodal-input'
import {
  isCharacter,
  isCharacterGroup,
  useActiveCharacterOrGroup,
} from '@/hooks/use-character-or-group'
import { useMessages } from '@/hooks/use-message'
import { useActiveLanguageModel } from '@/hooks/use-model'
import { useCustomizeModelPreset } from '@/hooks/use-model-preset'
import { useSettings } from '@/hooks/use-settings'
import { ContentArea } from './content-area'
import { buildMessageTree, Messages } from './messages'

export function Chat({ id }: { id: string }) {
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
        : undefined,
    [data, hasNextPage, isSuccess],
  )

  const [branch, setBranch] = useState<MessageNode[]>()

  useEffect(() => {
    // Only initialize the message branch if it is not already set or if the tree has changed
    if (!tree || branch) {
      return
    }
    const nodes: MessageNode[] = []
    let current: MessageNode | undefined = tree.latest
    while (current) {
      nodes.push(current)
      current = current.parent
    }
    setBranch(nodes.reverse())
  }, [branch, tree])

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

  const prepareRequestBody = useCallback(
    ({ id, messages: uiMessages }: { id: string; messages: UIMessage[] }) => {
      if (!branch || !model) {
        throw new Error('Message branch is not initialized')
      }

      const lastMessage = uiMessages[uiMessages.length - 1]
      if (!lastMessage) {
        throw new Error('No messages')
      }

      const messages: ReducedMessage[] = branch.map((node) => node.message)
      const last = messages[messages.length - 1]
      const secondLast = messages[messages.length - 2]
      if (lastMessage.id === last?.id) {
        messages[messages.length - 1] = {
          ...last,
          content: lastMessage,
        }
      } else if (lastMessage.id === secondLast?.id) {
        messages[messages.length - 2] = {
          ...secondLast,
          content: lastMessage,
        }
        // Remove the last message
        messages.splice(messages.length - 1, 1)
      } else {
        messages.push({
          id: lastMessage.id,
          role: lastMessage.role as any,
          content: lastMessage,
          createdAt: lastMessage.createdAt ?? new Date(),
        })
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
        modelId: model.id,
      }
    },
    [branch, charOrGroup, model, modelPreset, settings],
  )

  const onFinish = useCallback((message: Message) => {
    console.log(message)
    // TODO
  }, [])

  const { messages, setMessages, handleSubmit, input, setInput, append, status, stop, reload } =
    useChat({
      id,
      experimental_throttle: 100,
      sendExtraMessageFields: true,
      generateId: generateMessageId,
      experimental_prepareRequestBody: prepareRequestBody,
      onFinish,
    })

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
        {branch && <Messages ref={ref} messages={branch} navigate={navigate} />}
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
      />
    </>
  )
}
