import type { InfiniteData } from '@tanstack/react-query'
import type { AppRouter } from '@tavern/api'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useEffect, useMemo } from 'react'
import { skipToken, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCharFirstMessages, randomPickCharFirstMessage, substituteMacros } from '@tavern/core'
import { atom, useAtom } from 'jotai'
import { toast } from 'sonner'

import { useActive } from '@/hooks/use-active'
import { useCharacters } from '@/hooks/use-character'
import { useCharacterGroups } from '@/hooks/use-character-group'
import { useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
type ChatListOutput = RouterOutput['chat']['list']
export type Chat = ChatListOutput['chats'][number]

const PAGE_SIZE = 10 // TODO

const activeChatIdAtom = atom<string | undefined>(undefined)

export function useActiveChatId() {
  const [activeChatId, setActiveChat] = useAtom(activeChatIdAtom)
  return {
    activeChatId,
    setActiveChat,
  }
}

export function useActiveChat() {
  const { activeChatId } = useActiveChatId()

  const activeCharOrGroup = useActiveCharacterOrGroup()
  const { data: chats, isLoading, isSuccess } = useChatsByCharacterOrGroup(activeCharOrGroup?.id)

  const activeChat = useMemo(() => {
    if (!isSuccess || !activeChatId) return undefined
    return chats.pages.flatMap((page) => page.chats).find((chat) => chat.id === activeChatId)
  }, [activeChatId, chats, isSuccess])

  return {
    activeChat: activeChat,
    isLoading,
    isSuccess,
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
          ...data.chat,
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
          ...data.chat,
          characterId: undefined,
        }
        updateChatLists(chatItem)
      },
      onError: (error) => {
        toast.error(`Failed to create chat: ${error.message}`)
      },
    }),
  )

  const { settings, modelPreset, model, charOrGroup, persona } = useActive()

  return useCallback(
    async (charOrGroupId: string, chatId?: string): Promise<{ chat: Chat } | undefined> => {
      if (!model || !charOrGroup || !persona) {
        return
      }

      const character = characters.find((c) => c.id === charOrGroupId)
      if (character) {
        const { evaluateMacros } = substituteMacros({
          settings,
          modelPreset,
          model,
          persona,
          character: character.content,
        })

        const firstMsgs = getCharFirstMessages(character)

        const initialMessages = firstMsgs.map((firstMsg) => {
          return [
            {
              role: 'assistant',
              content: {
                parts: [
                  {
                    type: 'text',
                    text: evaluateMacros(firstMsg),
                  },
                ],
                annotations: [
                  {
                    characterId: character.id,
                  },
                ],
              },
            },
          ]
        })

        return await createForCharacterMutation.mutateAsync({
          characterId: charOrGroupId,
          id: chatId,
          // @ts-ignore
          initialMessages,
        })
      }

      const group = groups.find((g) => g.id === charOrGroupId)
      if (group) {
        const initialMessages = [
          group.characters
            .map((character) => {
              const { evaluateMacros } = substituteMacros({
                settings,
                modelPreset,
                model,
                persona,
                character: character.content,
                group,
              })

              const firstMsg = randomPickCharFirstMessage(character)
              if (!firstMsg) {
                return
              }
              return {
                role: 'assistant' as const,
                content: {
                  parts: [
                    {
                      type: 'text' as const,
                      text: evaluateMacros(firstMsg),
                    },
                  ],
                  annotations: [
                    {
                      characterId: character.id,
                    },
                  ],
                },
              }
            })
            .filter((message): message is NonNullable<typeof message> => !!message),
        ]

        return await createForGroupMutation.mutateAsync({
          groupId: charOrGroupId,
          id: chatId,
          // @ts-ignore
          initialMessages,
        })
      }

      console.error('Invalid id: neither a character nor a group')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characters, groups, settings, modelPreset, model, charOrGroup, persona],
  )
}

const hasAttemptedCreateAtom = atom(false)

export function useCheckFirstChat() {
  const activeCharOrGroup = useActiveCharacterOrGroup()
  const { data: chats, isSuccess } = useChatsByCharacterOrGroup(activeCharOrGroup?.id)

  const { setActiveChat } = useActiveChatId()

  const firstChatId = chats?.pages[0]?.chats[0]?.id
  useEffect(() => {
    setActiveChat(firstChatId)
  }, [firstChatId, setActiveChat])

  const createChat = useCreateChat()

  const [hasAttemptedCreate, setHasAttemptedCreate] = useAtom(hasAttemptedCreateAtom)

  useEffect(() => {
    const id = chats?.pages[0]?.chats[0]?.id
    if (activeCharOrGroup && isSuccess && !id && !hasAttemptedCreate) {
      setHasAttemptedCreate(true)
      void createChat(activeCharOrGroup.id).finally(() => {
        setHasAttemptedCreate(false)
      })
    }
  }, [
    activeCharOrGroup,
    chats,
    isSuccess,
    createChat,
    hasAttemptedCreate,
    setHasAttemptedCreate,
  ])
}

export function useUpdateChat(characterId?: string, groupId?: string) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.chat.update.mutationOptions({
      onMutate: async (newData) => {
        // Cancel any outgoing refetches for all chat list queries
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: trpc.chat.list.infiniteQueryKey({
              limit: PAGE_SIZE,
            }),
          }),
          characterId &&
            queryClient.cancelQueries({
              queryKey: trpc.chat.listByCharacter.infiniteQueryKey({
                characterId,
                limit: PAGE_SIZE,
              }),
            }),
          groupId &&
            queryClient.cancelQueries({
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
          listByCharacter: characterId
            ? queryClient.getQueryData<InfiniteData<ChatListOutput>>(
                trpc.chat.listByCharacter.infiniteQueryKey({
                  characterId,
                  limit: PAGE_SIZE,
                }),
              )
            : undefined,
          listByGroup: groupId
            ? queryClient.getQueryData<InfiniteData<ChatListOutput>>(
                trpc.chat.listByGroup.infiniteQueryKey({
                  groupId,
                  limit: PAGE_SIZE,
                }),
              )
            : undefined,
        }

        // Helper function to update chat list
        const updateChatList = (queryKey: unknown[]) => {
          queryClient.setQueryData<InfiniteData<ChatListOutput>>(queryKey, (old) => {
            if (!old) {
              return undefined
            }

            // Find the page and index of the chat to update
            let targetPageIndex = -1
            let targetChatIndex = -1
            let targetChat: Chat | undefined
            for (let pageIndex = 0; pageIndex < old.pages.length; pageIndex++) {
              const page = old.pages[pageIndex]!
              const chatIndex = page.chats.findIndex((chat) => chat.id === newData.id)
              if (chatIndex >= 0) {
                targetPageIndex = pageIndex
                targetChatIndex = chatIndex
                targetChat = page.chats[chatIndex]
                break
              }
            }

            if (!targetChat || targetPageIndex === -1 || targetChatIndex === -1) {
              return old
            }

            const updatedChat: Chat = {
              ...targetChat,
              ...newData,
              updatedAt: new Date(),
            }

            // If the chat is already in the first page and first position, just update it
            if (targetPageIndex === 0 && targetChatIndex === 0) {
              return {
                pages: old.pages.map((page, pageIndex) =>
                  pageIndex === 0
                    ? {
                        ...page,
                        chats: page.chats.map((chat, chatIndex) =>
                          chatIndex === 0 ? updatedChat : chat,
                        ),
                      }
                    : page,
                ),
                pageParams: old.pageParams,
              }
            }

            // Remove the chat from its original position
            const newPages = old.pages.map((page, pageIndex) =>
              pageIndex === targetPageIndex
                ? {
                    ...page,
                    chats: page.chats.filter((_, chatIndex) => chatIndex !== targetChatIndex),
                  }
                : page,
            )

            // Add the updated chat to the first position of the first page
            if (newPages[0]) {
              newPages[0] = {
                ...newPages[0],
                chats: [updatedChat, ...newPages[0].chats],
              }
            }

            return {
              pages: newPages,
              pageParams: old.pageParams,
            }
          })
        }

        // Optimistically update all chat lists
        updateChatList(
          trpc.chat.list.infiniteQueryKey({
            limit: PAGE_SIZE,
          }),
        )
        if (characterId) {
          updateChatList(
            trpc.chat.listByCharacter.infiniteQueryKey({
              characterId,
              limit: PAGE_SIZE,
            }),
          )
        }
        if (groupId) {
          updateChatList(
            trpc.chat.listByGroup.infiniteQueryKey({
              groupId,
              limit: PAGE_SIZE,
            }),
          )
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
        toast.error(`Failed to update chat: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string, data?: Partial<Chat>) => {
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
          characterId &&
            queryClient.cancelQueries({
              queryKey: trpc.chat.listByCharacter.infiniteQueryKey({
                characterId,
                limit: PAGE_SIZE,
              }),
            }),
          groupId &&
            queryClient.cancelQueries({
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
          listByCharacter: characterId
            ? queryClient.getQueryData<InfiniteData<ChatListOutput>>(
                trpc.chat.listByCharacter.infiniteQueryKey({
                  characterId,
                  limit: PAGE_SIZE,
                }),
              )
            : undefined,
          listByGroup: groupId
            ? queryClient.getQueryData<InfiniteData<ChatListOutput>>(
                trpc.chat.listByGroup.infiniteQueryKey({
                  groupId,
                  limit: PAGE_SIZE,
                }),
              )
            : undefined,
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
        updateChatList(
          trpc.chat.list.infiniteQueryKey({
            limit: PAGE_SIZE,
          }),
        )
        if (characterId) {
          updateChatList(
            trpc.chat.listByCharacter.infiniteQueryKey({
              characterId,
              limit: PAGE_SIZE,
            }),
          )
        }
        if (groupId) {
          updateChatList(
            trpc.chat.listByGroup.infiniteQueryKey({
              groupId,
              limit: PAGE_SIZE,
            }),
          )
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

export function useSetFirstChat(characterId?: string, groupId?: string) {
  const { data: chats } = useChatsByCharacterOrGroup(characterId ?? groupId)
  const updateChat = useUpdateChat(characterId, groupId)

  return useCallback(
    async (id: string) => {
      if (!chats?.pages[0]?.chats[0]) {
        return
      }

      const firstChat = chats.pages[0].chats[0]
      if (firstChat.id === id) {
        return
      }

      return await updateChat(id)
    },
    [chats, updateChat],
  )
}
