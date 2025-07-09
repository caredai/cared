import type { Message, MessageNode } from '@tavern/core'
import { useCallback, useEffect, useRef } from 'react'
import { atom, useAtom } from 'jotai'
import hash from 'stable-hash'

import { useActiveChat } from '@/hooks/use-chat'
import { useMessages } from '@/hooks/use-message'

export interface MessageTree {
  tree: MessageNode[]
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
  const pathRef = useRef<string[]>([])

  useEffect(() => {
    treeRef.current =
      isSuccess && !hasNextPage
        ? buildMessageTree(data.pages.flatMap((page) => page.messages).reverse())
        : undefined

    branchRef.current = (() => {
      if (!treeRef.current?.tree.length) {
        pathRef.current = []
        return []
      }

      const newBranch: MessageNode[] = []
      let parent = treeRef.current.tree[0]!.parent
      for (let level = 0; ; ++level) {
        const id = pathRef.current[level]
        const node = id ? parent.descendants.find((node) => node.message.id === id) : undefined
        if (!node) {
          newBranch.push(...findLatestBranch(parent))
          pathRef.current = newBranch.map((node) => node.message.id)
          return newBranch
        } else {
          newBranch.push(node)
          parent = node
        }
      }
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
    (currentNodeOrId: MessageNode | string, previous: boolean) => {
      const tree = treeRef.current
      if (!tree) {
        return
      }

      const current =
        typeof currentNodeOrId === 'string'
          ? findNodeById(tree.tree, currentNodeOrId)
          : currentNodeOrId
      if (!current) {
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
        const newBranch = findLatestBranch(newCurrent, true)
        pathRef.current = newBranch.map((node) => node.message.id)
        branchRef.current = newBranch
        setBranch(newBranch)
        return
      }

      setBranch((branch) => {
        const position = branch.findIndex((m) => m === current)
        if (position < 0) {
          return branch
        }
        const newBranch = [...branch.slice(0, position)]
        newBranch.push(...findLatestBranch(newCurrent, true))
        pathRef.current = newBranch.map((node) => node.message.id)
        branchRef.current = newBranch
        return newBranch
      })
    },
    [setBranch],
  )

  const update = useCallback((id: string, update: (message: Message) => Message) => {
    const node = branchRef.current.find((node) => node.message.id === id)
    if (node) {
      node.message = update(node.message)
      setBranch(branchRef.current)
    }
  }, [setBranch])

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
    update,
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

    // Build descendants and set their parent to the current node
    currentNode.descendants = children.map((child) => buildNode(child, currentNode))

    return currentNode
  }

  const rootParent = {
    descendants: [] as MessageNode[],
  }

  const tree = rootMessages.map((rootMessage) => buildNode(rootMessage, rootParent))

  rootParent.descendants = tree

  return {
    tree,
    allMessages: allOrderedMessages,
  }
}

function findNodeById(tree: MessageNode[], id: string): MessageNode | undefined {
  for (const node of tree) {
    if (node.message.id === id) {
      return node
    }
    const found = findNodeById(node.descendants, id)
    if (found) {
      return found
    }
  }
  return undefined
}

function findLatestBranch(
  node: { message?: Message; descendants: MessageNode[] },
  include?: boolean,
): MessageNode[] {
  // Find the latest descendant node (node with maximum id)
  let latest: MessageNode | undefined = undefined
  let maxId = ''

  // Recursively search through all descendants to find the node with maximum id
  function findLatest(node: { message?: Message; descendants: MessageNode[] }): void {
    for (const descendant of node.descendants) {
      if (descendant.message.id > maxId) {
        maxId = descendant.message.id
        latest = descendant
      }
      findLatest(descendant)
    }
  }

  findLatest(node)

  // Build path from latest node back to input node (excluded)
  const path: MessageNode[] = []
  let current = latest as MessageNode | undefined

  while (current && current !== node) {
    path.push(current)
    // Navigate up to parent
    current = current.parent.message ? current.parent : undefined
  }

  if (include && node.message) {
    path.push(node as MessageNode)
  }

  // Reverse the path to get the correct order
  return path.reverse()
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
