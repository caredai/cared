import type { Message, MessageNode } from '@tavern/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { atom, useAtom } from 'jotai'
import hash from 'stable-hash'

import { useActiveChat } from '@/hooks/use-chat'
import { useMessages } from '@/hooks/use-message'

const hasAttemptedFetchAtom = atom(false)

export function useMessageTree() {
  const { activeChat: chat } = useActiveChat()
  const chatId = chat?.id

  const { data, isLoading, isSuccess, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(chatId)

  const [hasAttemptedFetch, setHasAttemptedFetch] = useAtom(hasAttemptedFetchAtom)

  useEffect(() => {
    void (async function () {
      if (hasNextPage && !isFetchingNextPage && !isLoading && !hasAttemptedFetch) {
        console.log('Fetching messages...')
        setHasAttemptedFetch(true)
        await fetchNextPage().finally(() => setHasAttemptedFetch(false))
      }
    })()
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    hasAttemptedFetch,
    setHasAttemptedFetch,
  ])

  const [tree, setTree] = useState<MessageTree>()
  const [branch, setBranch] = useState<MessageNode[]>([])
  const treeRef = useRef<MessageTree>(undefined)
  const branchRef = useRef<MessageNode[]>([])

  useEffect(() => {
    treeRef.current =
      isSuccess && !hasNextPage
        ? buildMessageTree(data.pages.flatMap((page) => page.messages))
        : undefined

    branchRef.current = (() => {
      if (!treeRef.current) {
        return []
      }
      const nodes: MessageNode[] = []
      let current: MessageNode | undefined = treeRef.current.latest
      while (current) {
        nodes.push(current)
        current = current.parent
      }
      return nodes.reverse()
    })()

    setTree((oldTree) => {
      const newTree = treeRef.current
      if (newTree && oldTree && !newTree.isChanged(oldTree.allMessages)) {
        return oldTree
      }
      setBranch(branchRef.current)
      return newTree
    })
  }, [data, hasNextPage, isSuccess])

  const navigate = useCallback(
    (current: MessageNode, previous: boolean) => {
      if (!tree) {
        return
      }
      const isRoot = tree.tree.find((node) => node === current)
      const siblings = isRoot ? tree.tree : current.parent?.descendants

      const index = siblings?.findIndex((node) => node === current)
      if (index === undefined || index < 0) {
        return
      }
      const newIndex = previous ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= (siblings?.length ?? 0)) {
        return
      }
      const newCurrent = siblings?.[newIndex]
      if (!newCurrent) {
        return
      }

      if (isRoot) {
        const nodes = []
        let c: MessageNode | undefined = newCurrent
        while (c) {
          nodes.push(c)
          let latest: MessageNode | undefined = undefined
          let maxId = ''
          for (const child of c.descendants) {
            if (!maxId || child.message.id > maxId) {
              latest = child
              maxId = child.message.id
            }
          }
          c = latest
        }
        setBranch(nodes)
        return
      }

      setBranch((branch) => {
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
    },
    [tree],
  )

  return {
    isLoading,
    isSuccess,
    hasNextPage,
    isFetchingNextPage,
    tree,
    treeRef,
    branch,
    branchRef,
    navigate,
  }
}

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
