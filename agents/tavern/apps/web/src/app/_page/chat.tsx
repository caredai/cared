import { useCallback, useEffect, useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'

import { generateMessageId } from '@ownxai/sdk'

import type { MessageNode } from './messages'
import { MultimodalInput } from '@/app/_page/multimodal-input'
import { useMessages } from '@/hooks/use-message'
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

  const { messages, setMessages, handleSubmit, input, setInput, append, status, stop, reload } =
    useChat({
      id,
      experimental_throttle: 100,
      sendExtraMessageFields: true,
      generateId: generateMessageId,
    })

  return (
    <>
      <ContentArea>{branch && <Messages messages={branch} navigate={navigate} />}</ContentArea>
      <MultimodalInput />
    </>
  )
}
