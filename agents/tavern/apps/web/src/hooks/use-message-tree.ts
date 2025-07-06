import type { Message, MessageNode } from '@tavern/core'
import { useCallback, useEffect, useRef } from 'react'
import { atom, useAtom } from 'jotai'
import hash from 'stable-hash'

import { useActiveChat } from '@/hooks/use-chat'
import { useMessages } from '@/hooks/use-message'

export interface MessageTree {
  tree: MessageNode[]
  latest: MessageNode
  allMessages: Message[]
}

const treeAtom = atom<MessageTree>()
const branchAtom = atom<MessageNode[]>([])
const isReadyAtom = atom(false)
const hasAttemptedFetchAtom = atom(false)

export function useMessageTree() {
  const [tree] = useAtom(treeAtom)
  const [branch] = useAtom(branchAtom)
  const [isReady] = useAtom(isReadyAtom)

  return {
    tree,
    branch,
    isReady,
  }
}

export function useBuildMessageTree() {
  const { activeChat: chat, isLoading: isChatLoading, isSuccess: isChatSuccess } = useActiveChat()

  const { data, isLoading, isSuccess, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(chat?.id)

  const [, setIsReady] = useAtom(isReadyAtom)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useAtom(hasAttemptedFetchAtom)

  useEffect(() => {
    setIsReady(isSuccess && !hasNextPage)
  }, [isSuccess, hasNextPage, setIsReady])

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

  const [tree, setTree] = useAtom(treeAtom)
  const [branch, setBranch] = useAtom(branchAtom)
  const treeRef = useRef<MessageTree>(undefined)
  const branchRef = useRef<MessageNode[]>([])

  useEffect(() => {
    treeRef.current =
      isSuccess && !hasNextPage
        ? buildMessageTree(data.pages.flatMap((page) => page.messages).reverse())
        : undefined

    branchRef.current = (() => {
      if (!treeRef.current) {
        return []
      }
      const nodes: MessageNode[] = []
      let current: MessageNode | undefined = treeRef.current.latest
      while (current) {
        nodes.push(current)
        current = current.parent.message ? current.parent : undefined
      }
      return nodes.reverse()
    })()

    setTree((oldTree) => {
      const newTree = treeRef.current
      if (newTree && oldTree && !isMessagesChanged(newTree.allMessages, oldTree.allMessages)) {
        return oldTree
      }
      setBranch(branchRef.current)
      return newTree
    })
  }, [data, hasNextPage, isSuccess, setBranch, setTree])

  const navigate = useCallback(
    (current: MessageNode, previous: boolean) => {
      if (!tree) {
        return
      }
      const isRoot = tree.tree.find((node) => node === current)
      const siblings = isRoot ? tree.tree : current.parent.descendants

      const index = siblings.findIndex((node) => node === current)
      if (index < 0) {
        return
      }
      const newIndex = previous ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= siblings.length) {
        return
      }
      const newCurrent = siblings[newIndex]
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
        branchRef.current = nodes
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
        branchRef.current = newBranch
        return newBranch
      })
    },
    [setBranch, tree],
  )

  return {
    isChatLoading,
    isChatSuccess,
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

export function buildMessageTree(allOrderedMessages?: Message[]): MessageTree | undefined {
  if (!allOrderedMessages) {
    return
  }

  // Create a map to store parent-child relationships
  const childrenMap = new Map<string, Message[]>()

  // Group messages by their parentId
  allOrderedMessages.forEach((message) => {
    if (message.parentId) {
      if (!childrenMap.has(message.parentId)) {
        childrenMap.set(message.parentId, [])
      }
      childrenMap.get(message.parentId)?.push(message)
    }
  })

  // Find root messages (message with empty parentId)
  const rootMessages = allOrderedMessages.filter((message) => !message.parentId)

  // If no root message found, return empty
  if (!rootMessages.length) {
    return
  }

  // Track the latest message node during tree building
  let latest: MessageNode
  let maxId = ''

  // Recursive function to build the tree structure and track the latest
  function buildNode(
    message: Message,
    parent: MessageNode | { descendants: MessageNode[] },
  ): MessageNode {
    const children: Message[] = childrenMap.get(message.id) ?? []
    const currentNode: MessageNode = {
      message,
      parent,
      descendants: [],
    }

    // Check if the current node is the latest
    if (!maxId || message.id > maxId) {
      maxId = message.id
      latest = currentNode
    }

    // Build descendants and set their parent to the current node
    currentNode.descendants = children.map((child) => buildNode(child, currentNode))

    return currentNode
  }

  const tree = rootMessages.map((rootMessage) =>
    buildNode(rootMessage, {
      descendants: [],
    }),
  )

  tree.forEach((rootNode) => {
    rootNode.parent.descendants = tree
  })

  return {
    tree,
    latest: latest!,
    allMessages: allOrderedMessages,
  }
}

function isMessagesChanged(allNewMessages: Message[], oldAllMessages: Message[]) {
  if (allNewMessages.length !== oldAllMessages.length) {
    console.log('Message count changed:', allNewMessages.length, oldAllMessages.length)
    return true
  }
  for (let i = 0; i < allNewMessages.length; i++) {
    if (hash(allNewMessages[i]) !== hash(oldAllMessages[i])) {
      console.log('Message content changed at index:', i, allNewMessages[i], oldAllMessages[i])
      return true
    }
  }
  return false
}
