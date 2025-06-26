import type { Message, MessageNode } from '@tavern/core'
import type { RefObject } from 'react'
import type { VListHandle } from 'virtua'
import { memo, useMemo } from 'react'
import { motion } from 'motion/react'
import hash from 'stable-hash'
import { VList } from 'virtua'

import { PreviewMessage } from '@/app/_page/message'

function PureMessages({
  ref,
  endRef,
  messages,
  navigate,
}: {
  ref: RefObject<VListHandle | null>
  endRef: RefObject<HTMLDivElement | null>
  messages: MessageNode[]
  navigate: (current: MessageNode, previous: boolean) => void
}) {
  const indices = useMemo(() => {
    return messages.map((message) => {
      const index = message.parent?.descendants.findIndex((m) => m === message) ?? 0
      const count = message.parent?.descendants.length ?? 0
      return {
        index: index >= 0 ? index : 0,
        count,
      }
    })
  }, [messages])

  return (
    <VList ref={ref}>
      {messages.map((message, i) => (
        <PreviewMessage
          key={message.message.id}
          message={message.message}
          index={indices[i]!.index}
          count={indices[i]!.count}
          navigate={(previous) => navigate(message, previous)}
        />
      ))}

      <motion.div ref={endRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
    </VList>
  )
}

export const Messages = memo(PureMessages)

export type MessageTree =
  | {
      tree: MessageNode[]
      latest: MessageNode
      allMessages: Message[]
      isChanged: (oldAllMessages: Message[]) => boolean
    }
  | undefined

export function buildMessageTree(allMessages?: Message[]): MessageTree {
  if (!allMessages) {
    return
  }

  // Create a map to store parent-child relationships
  const childrenMap = new Map<string, Message[]>()

  // Group messages by their parentId
  allMessages.forEach((message) => {
    if (message.parentId) {
      if (!childrenMap.has(message.parentId)) {
        childrenMap.set(message.parentId, [])
      }
      childrenMap.get(message.parentId)!.push(message)
    }
  })

  // Find root messages (message with empty parentId)
  const rootMessages = allMessages.filter((message) => !message.parentId)

  // If no root message found, return empty
  if (!rootMessages.length) {
    return
  }

  // Track the latest message node during tree building
  let latest: MessageNode
  let maxId = ''

  // Recursive function to build the tree structure and track latest
  function buildNode(message: Message, parent?: MessageNode): MessageNode {
    const children: Message[] = childrenMap.get(message.id) ?? []
    const currentNode: MessageNode = {
      message,
      parent,
      descendants: [],
    }

    // Check if current node is the latest
    if (!maxId || message.id > maxId) {
      maxId = message.id
      latest = currentNode
    }

    // Build descendants and set their parent to current node
    currentNode.descendants = children.map((child) => buildNode(child, currentNode))

    return currentNode
  }

  const tree = rootMessages.map((rootMessage) => buildNode(rootMessage))

  const isChanged = (oldAllMessages: Message[]) => {
    if (allMessages.length !== oldAllMessages.length) {
      console.log('Message count changed:', allMessages.length, oldAllMessages.length)
      return true
    }
    for (let i = 0; i < allMessages.length; i++) {
      if (hash(allMessages[i]) !== hash(oldAllMessages[i])) {
        console.log('Message content changed at index:', i, allMessages[i], oldAllMessages[i])
        return true
      }
    }
    return false
  }

  return {
    tree,
    latest: latest!,
    allMessages,
    isChanged,
  }
}
