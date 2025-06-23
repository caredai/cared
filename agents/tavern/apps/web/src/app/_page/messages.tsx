import type { Message } from '@tavern/core'
import type { VListHandle } from 'virtua'
import type { RefObject} from 'react';
import { memo, useMemo} from 'react'
import { VList } from 'virtua'

import { PreviewMessage } from '@/app/_page/message'

function PureMessages({
  ref,
  messages,
  navigate,
}: {
  ref: RefObject<VListHandle | null>
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
    </VList>
  )
}

export const Messages = memo(PureMessages)

export interface MessageNode {
  message: Message
  parent?: MessageNode
  descendants: MessageNode[]
}

export function buildMessageTree(allMessages?: Message[]):
  | {
      tree: MessageNode
      latest: MessageNode
    }
  | undefined {
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

  // Find root message (message with empty parentId)
  const rootMessage = allMessages.find((message) => !message.parentId)

  // If no root message found, return empty
  if (!rootMessage) {
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

  const tree = buildNode(rootMessage)

  return {
    tree,
    latest: latest!,
  }
}
