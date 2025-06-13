import type { InfiniteData } from '@tanstack/react-query'
import type { AppRouter } from '@tavern/api'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useMemo } from 'react'
import {
  skipToken,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { atom, useAtom } from 'jotai'
import { toast } from 'sonner'

import { useCharacters } from '@/hooks/use-character'
import { useCharacterGroups } from '@/hooks/use-character-group'
import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
type ChatListOutput = RouterOutput['chat']['list']
export type Chat = ChatListOutput['chats'][number]

const PAGE_SIZE = 10

const activeChatIdAtom = atom<string | undefined>(undefined)

export function useSetActiveChat() {
  const [, setActiveChat] = useAtom(activeChatIdAtom)
  return setActiveChat
}

export function useActiveChat() {
  const [activeChatId] = useAtom(activeChatIdAtom)

  const trpc = useTRPC()

  const { data, refetch } = useQuery({
    ...trpc.chat.get.queryOptions(
      activeChatId
        ? {
            id: activeChatId,
          }
        : skipToken,
    ),
  })

  return {
    activeChat: data,
    refetchActiveChat: refetch,
  }
}

export function useChats() {
  const trpc = useTRPC()

  return useInfiniteQuery(
    trpc.chat.list.infiniteQueryOptions(
      {
        limit: PAGE_SIZE,
      },
      {
        getNextPageParam: (lastPage) => {
          if (!lastPage.hasMore) return undefined
          return lastPage.cursor
        },
        // placeholderData: keepPreviousData,
      },
    ),
  )
}

export function useChatsByCharacter(characterId?: string) {
  const trpc = useTRPC()

  return useInfiniteQuery(
    trpc.chat.listByCharacter.infiniteQueryOptions(
      characterId
        ? {
            characterId,
            limit: PAGE_SIZE,
          }
        : skipToken,
      {
        getNextPageParam: (lastPage) => {
          if (!lastPage.hasMore) return undefined
          return lastPage.cursor
        },
      },
    ),
  )
}

export function useChatsByGroup(groupId?: string) {
  const trpc = useTRPC()

  return useInfiniteQuery(
    trpc.chat.listByGroup.infiniteQueryOptions(
      groupId
        ? {
            groupId,
            limit: PAGE_SIZE,
          }
        : skipToken,
      {
        getNextPageParam: (lastPage) => {
          if (!lastPage.hasMore) return undefined
          return lastPage.cursor
        },
      },
    ),
  )
}

export function useChatsByCharacterOrGroup(characterOrGroupId?: string) {
  const { characters } = useCharacters()

  const isCharacter = useMemo(
    () => characters.some((char) => char.id === characterOrGroupId),
    [characters, characterOrGroupId],
  )

  const characterChats = useChatsByCharacter(isCharacter ? characterOrGroupId : undefined)
  const groupChats = useChatsByGroup(!isCharacter ? characterOrGroupId : undefined)

  return isCharacter ? characterChats : groupChats
}

export function useCreateChat() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { characters } = useCharacters()
  const { groups } = useCharacterGroups()

  // Helper function to update chat lists with new chat
  const updateChatLists = (newChat: Chat) => {
    const updateChatList = (queryKey: unknown[]) => {
      queryClient.setQueryData<InfiniteData<ChatListOutput>>(queryKey, (old) => {
        if (!old?.pages[0]) {
          return {
            pages: [
              {
                chats: [newChat],
                hasMore: false,
                cursor: undefined,
              },
            ],
            pageParams: [undefined],
          }
        }

        const firstPage = old.pages[0]

        return {
          ...old,
          pages: [
            {
              ...firstPage,
              chats: [newChat, ...firstPage.chats],
            },
            ...old.pages.slice(1),
          ],
        }
      })
    }

    // Update all relevant chat lists
    updateChatList(
      trpc.chat.list.infiniteQueryKey({
        limit: PAGE_SIZE,
      }),
    )
    if (newChat.characterId) {
      updateChatList(
        trpc.chat.listByCharacter.infiniteQueryKey({
          characterId: newChat.characterId,
          limit: PAGE_SIZE,
        }),
      )
    }
    if (newChat.groupId) {
      updateChatList(
        trpc.chat.listByGroup.infiniteQueryKey({
          groupId: newChat.groupId,
          limit: PAGE_SIZE,
        }),
      )
    }
  }

  const createForCharacterMutation = useMutation(
    trpc.chat.createForCharacter.mutationOptions({
      onSuccess: (data) => {
        // Convert the mutation result to ChatItem type
        const chatItem: Chat = {
          ...data,
          groupId: undefined,
        }
        updateChatLists(chatItem)
      },
      onError: (error) => {
        toast.error(`Failed to create chat: ${error.message}`)
      },
    }),
  )

  const createForGroupMutation = useMutation(
    trpc.chat.createForGroup.mutationOptions({
      onSuccess: (data) => {
        // Convert the mutation result to ChatItem type
        const chatItem: Chat = {
          ...data,
          characterId: undefined,
        }
        updateChatLists(chatItem)
      },
      onError: (error) => {
        toast.error(`Failed to create chat: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string, chatId?: string) => {
      const character = characters.find((c) => c.id === id)
      if (character) {
        return await createForCharacterMutation.mutateAsync({
          characterId: id,
          id: chatId,
        })
      }

      const group = groups.find((g) => g.id === id)
      if (group) {
        return await createForGroupMutation.mutateAsync({
          groupId: id,
          id: chatId,
        })
      }

      console.error('Invalid id: neither a character nor a group')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characters, groups],
  )
}

export function useUpdateChat() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.chat.update.mutationOptions({
      onMutate: async (newData) => {
        // Cancel any outgoing refetches for all chat list queries
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: trpc.chat.list.infiniteQueryKey(),
          }),
          queryClient.cancelQueries({
            queryKey: trpc.chat.listByCharacter.infiniteQueryKey(),
          }),
          queryClient.cancelQueries({
            queryKey: trpc.chat.listByGroup.infiniteQueryKey(),
          }),
        ])

        // Snapshot the previous values
        const previousData = {
          list: queryClient.getQueryData<InfiniteData<ChatListOutput>>(
            trpc.chat.list.infiniteQueryKey(),
          ),
          listByCharacter: queryClient.getQueryData<InfiniteData<ChatListOutput>>(
            trpc.chat.listByCharacter.infiniteQueryKey(),
          ),
          listByGroup: queryClient.getQueryData<InfiniteData<ChatListOutput>>(
            trpc.chat.listByGroup.infiniteQueryKey(),
          ),
        }

        // Helper function to update chat list
        const updateChatList = (queryKey: unknown[]) => {
          queryClient.setQueryData<InfiniteData<ChatListOutput>>(queryKey, (old) => {
            if (!old) {
              return undefined
            }
            return {
              pages: old.pages.map((page) => ({
                ...page,
                chats: page.chats.map((chat) =>
                  chat.id === newData.id ? { ...chat, ...newData } : chat,
                ),
              })),
              pageParams: old.pageParams,
            }
          })
        }

        // Optimistically update all chat lists
        updateChatList(trpc.chat.list.infiniteQueryKey())
        updateChatList(trpc.chat.listByCharacter.infiniteQueryKey())
        updateChatList(trpc.chat.listByGroup.infiniteQueryKey())

        return { previousData }
      },
      onError: (error, newData, context) => {
        // Rollback on error for all chat lists
        if (context?.previousData) {
          if (context.previousData.list) {
            queryClient.setQueryData<InfiniteData<ChatListOutput>>(
              trpc.chat.list.infiniteQueryKey(),
              context.previousData.list,
            )
          }
          if (context.previousData.listByCharacter) {
            queryClient.setQueryData<InfiniteData<ChatListOutput>>(
              trpc.chat.listByCharacter.infiniteQueryKey(),
              context.previousData.listByCharacter,
            )
          }
          if (context.previousData.listByGroup) {
            queryClient.setQueryData<InfiniteData<ChatListOutput>>(
              trpc.chat.listByGroup.infiniteQueryKey(),
              context.previousData.listByGroup,
            )
          }
        }
        toast.error(`Failed to update chat: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string, data: Partial<Chat>) => {
      return await updateMutation.mutateAsync({
        id,
        ...data,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useDeleteChat(characterId?: string, groupId?: string) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.chat.delete.mutationOptions({
      onMutate: async (newData) => {
        // Cancel any outgoing refetches for all chat list queries
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: trpc.chat.list.infiniteQueryKey({
              limit: PAGE_SIZE,
            }),
          }),
          characterId && queryClient.cancelQueries({
            queryKey: trpc.chat.listByCharacter.infiniteQueryKey({
              characterId,
              limit: PAGE_SIZE,
            }),
          }),
          groupId && queryClient.cancelQueries({
            queryKey: trpc.chat.listByGroup.infiniteQueryKey({
              groupId,
              limit: PAGE_SIZE,
            }),
          }),
        ])

        // Snapshot the previous values
        const previousData = {
          list: queryClient.getQueryData<InfiniteData<ChatListOutput>>(
            trpc.chat.list.infiniteQueryKey({
              limit: PAGE_SIZE,
            }),
          ),
          listByCharacter: characterId ? queryClient.getQueryData<InfiniteData<ChatListOutput>>(
            trpc.chat.listByCharacter.infiniteQueryKey({
              characterId,
              limit: PAGE_SIZE,
            }),
          ) : undefined,
          listByGroup: groupId ? queryClient.getQueryData<InfiniteData<ChatListOutput>>(
            trpc.chat.listByGroup.infiniteQueryKey({
              groupId,
              limit: PAGE_SIZE,
            }),
          ) : undefined,
        }

        // Helper function to update chat list
        const updateChatList = (queryKey: unknown[]) => {
          queryClient.setQueryData<InfiniteData<ChatListOutput>>(queryKey, (old) => {
            if (!old) {
              return undefined
            }
            return {
              pages: old.pages.map((page) => ({
                ...page,
                chats: page.chats.filter((chat) => chat.id !== newData.id),
              })),
              pageParams: old.pageParams,
            }
          })
        }

        // Optimistically update all chat lists
        updateChatList(trpc.chat.list.infiniteQueryKey({
          limit: PAGE_SIZE
        }))

        if (characterId) {
          updateChatList(trpc.chat.listByCharacter.infiniteQueryKey({
            characterId,
            limit: PAGE_SIZE,
          }))
        }
        if (groupId) {
          updateChatList(trpc.chat.listByGroup.infiniteQueryKey({
            groupId,
            limit: PAGE_SIZE,
          }))
        }

        return { previousData }
      },
      onError: (error, newData, context) => {
        // Rollback on error for all chat lists
        if (context?.previousData) {
          if (context.previousData.list) {
            queryClient.setQueryData<InfiniteData<ChatListOutput>>(
              trpc.chat.list.infiniteQueryKey({
                limit: PAGE_SIZE,
              }),
              context.previousData.list,
            )
          }
          if (context.previousData.listByCharacter && characterId) {
            queryClient.setQueryData<InfiniteData<ChatListOutput>>(
              trpc.chat.listByCharacter.infiniteQueryKey({
                characterId,
                limit: PAGE_SIZE,
              }),
              context.previousData.listByCharacter,
            )
          }
          if (context.previousData.listByGroup && groupId) {
            queryClient.setQueryData<InfiniteData<ChatListOutput>>(
              trpc.chat.listByGroup.infiniteQueryKey({
                groupId,
                limit: PAGE_SIZE,
              }),
              context.previousData.listByGroup,
            )
          }
        }
        toast.error(`Failed to delete chat: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string) => {
      return await deleteMutation.mutateAsync({
        id,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
