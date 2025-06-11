import type { AppRouter } from '@tavern/api'
import type { inferRouterOutputs } from '@trpc/server'
import { useInfiniteQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type ChatItem = RouterOutput['chat']['list']['chats'][number]

export function useChats() {
  const trpc = useTRPC()

  return useInfiniteQuery(
    trpc.chat.list.infiniteQueryOptions(
      {
        limit: 100,
      },
      {
        getNextPageParam: (lastPage) => {
          if (!lastPage.hasMore) return undefined
          return lastPage.cursor
        },
      },
    ),
  )
}

export function useChatsByCharacter(characterId: string) {
  const trpc = useTRPC()

  return useInfiniteQuery(
    trpc.chat.listByCharacter.infiniteQueryOptions(
      {
        characterId,
        limit: 100,
      },
      {
        getNextPageParam: (lastPage) => {
          if (!lastPage.hasMore) return undefined
          return lastPage.cursor
        },
      },
    ),
  )
}

export function useChatsByGroup(groupId: string) {
  const trpc = useTRPC()

  return useInfiniteQuery(
    trpc.chat.listByGroup.infiniteQueryOptions(
      {
        groupId,
        limit: 100,
      },
      {
        getNextPageParam: (lastPage) => {
          if (!lastPage.hasMore) return undefined
          return lastPage.cursor
        },
      },
    ),
  )
}
