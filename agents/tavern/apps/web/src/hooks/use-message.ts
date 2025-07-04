import type { InfiniteData } from '@tanstack/react-query'
import type { AppRouter } from '@tavern/api'
import type { Message, MessageContent } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback } from 'react'
import { skipToken, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import hash from 'stable-hash'

import type { Chat } from './use-chat'
import { useTRPC } from '@/trpc/client'
import { useSetFirstChat } from './use-chat'

type RouterOutput = inferRouterOutputs<AppRouter>
type MessageListOutput = RouterOutput['message']['list']

const PAGE_SIZE = 10 // TODO

export function useMessages(chatId?: string) {
  const trpc = useTRPC()

  return useInfiniteQuery(
    trpc.message.list.infiniteQueryOptions(
      chatId
        ? {
            chatId,
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

export function useMessage(chatId?: string, messageId?: string): Message | undefined {
  const { data } = useMessages(chatId)
  return data?.pages.flatMap((page) => page.messages).find((message) => message.id === messageId)
}

export function useCreateMessage(chatId?: string) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.message.create.mutationOptions({
      onMutate: async (newData) => {
        // Cancel any outgoing refetches for message list query
        if (chatId) {
          await queryClient.cancelQueries({
            queryKey: trpc.message.list.infiniteQueryKey({
              chatId,
              limit: PAGE_SIZE,
            }),
          })
        }

        // Snapshot the previous value
        const previousData = chatId
          ? queryClient.getQueryData<InfiniteData<MessageListOutput>>(
              trpc.message.list.infiniteQueryKey({
                chatId,
                limit: PAGE_SIZE,
              }),
            )
          : undefined

        // Optimistically add the new message to the list
        if (chatId) {
          queryClient.setQueryData<InfiniteData<MessageListOutput>>(
            trpc.message.list.infiniteQueryKey({
              chatId,
              limit: PAGE_SIZE,
            }),
            (old) => {
              if (!old) return undefined

              // @ts-ignore
              const newMessage: Message = {
                id: newData.id,
                parentId: newData.parentId ?? null,
                chatId: newData.chatId,
                role: newData.role,
                content: newData.content,
                createdAt: new Date(),
                updatedAt: new Date(),
              }

              return {
                pages: old.pages.map((page, index) => {
                  // Add the new message to the first page (most recent messages)
                  if (index === 0) {
                    return {
                      ...page,
                      messages: [newMessage, ...page.messages],
                    }
                  }
                  return page
                }),
                pageParams: old.pageParams,
              }
            },
          )
        }

        return { previousData }
      },
      onError: (error, newData, context) => {
        // Rollback on error
        if (context?.previousData && chatId) {
          queryClient.setQueryData<InfiniteData<MessageListOutput>>(
            trpc.message.list.infiniteQueryKey({
              chatId,
              limit: PAGE_SIZE,
            }),
            context.previousData,
          )
        }
        toast.error(`Failed to create message: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (args: {
      id: string
      parentId?: string
      role: 'user' | 'assistant'
      content: MessageContent
    }) => {
      if (!chatId) {
        return
      }

      return await createMutation.mutateAsync({
        chatId,
        ...args,
        isRoot: !args.parentId,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId],
  )
}

export function useUpdateMessage(chatId?: string) {
  const { data: messages } = useMessages(chatId)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.message.update.mutationOptions({
      onMutate: async (newData) => {
        // Cancel any outgoing refetches for message list query
        if (chatId) {
          await queryClient.cancelQueries({
            queryKey: trpc.message.list.infiniteQueryKey({
              chatId,
              limit: PAGE_SIZE,
            }),
          })
        }

        // Snapshot the previous value
        const previousData = chatId
          ? queryClient.getQueryData(
              trpc.message.list.infiniteQueryKey({
                chatId,
                limit: PAGE_SIZE,
              }),
            )
          : undefined

        // Optimistically update message list
        if (chatId) {
          queryClient.setQueryData<InfiniteData<MessageListOutput>>(
            trpc.message.list.infiniteQueryKey({
              chatId,
              limit: PAGE_SIZE,
            }),
            (old) => {
              if (!old) return undefined
              return {
                pages: old.pages.map((page) => ({
                  ...page,
                  messages: page.messages.map((message) =>
                    message.id === newData.id ? { ...message, ...newData } : message,
                  ),
                })),
                pageParams: old.pageParams,
              }
            },
          )
        }

        return { previousData }
      },
      onError: (error, newData, context) => {
        // Rollback on error
        if (context?.previousData && chatId) {
          queryClient.setQueryData(
            trpc.message.list.infiniteQueryKey({
              chatId,
              limit: PAGE_SIZE,
            }),
            context.previousData,
          )
        }
        toast.error(`Failed to update message: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string, content: MessageContent) => {
      const message = messages?.pages
        .flatMap((page) => page.messages)
        .find((message) => message.id === id)
      if (!message) {
        return
      }

      if (hash(content) === hash(message.content)) {
        return
      }

      return await updateMutation.mutateAsync({
        id,
        content,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages],
  )
}

export function useDeleteMessage(chatId?: string) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.message.delete.mutationOptions({
      onMutate: async (newData) => {
        // Cancel any outgoing refetches for message list query
        if (chatId) {
          await queryClient.cancelQueries({
            queryKey: trpc.message.list.infiniteQueryKey({
              chatId,
              limit: PAGE_SIZE,
            }),
          })
        }

        // Snapshot the previous value
        const previousData = chatId
          ? queryClient.getQueryData<InfiniteData<MessageListOutput>>(
              trpc.message.list.infiniteQueryKey({
                chatId,
                limit: PAGE_SIZE,
              }),
            )
          : undefined

        // Optimistically update message list
        if (chatId) {
          queryClient.setQueryData<InfiniteData<MessageListOutput>>(
            trpc.message.list.infiniteQueryKey({
              chatId,
              limit: PAGE_SIZE,
            }),
            (old) => {
              if (!old) return undefined

              // If deleteTrailing is true, we need to handle cascading deletion
              if (newData.deleteTrailing) {
                // Get all messages from all pages
                const allMessages = old.pages.flatMap((page) => page.messages)

                // Create a map of parentId to children for efficient lookup
                const parentToChildren = new Map<string, string[]>()
                allMessages.forEach((msg) => {
                  if (msg.parentId) {
                    if (!parentToChildren.has(msg.parentId)) {
                      parentToChildren.set(msg.parentId, [])
                    }
                    parentToChildren.get(msg.parentId)!.push(msg.id)
                  }
                })

                // Recursively collect all descendant message IDs
                const descendantIds = new Set<string>()
                const collectDescendants = (msgId: string) => {
                  if (!newData.excludeSelf || msgId !== newData.id) {
                    descendantIds.add(msgId)
                  }
                  const children = parentToChildren.get(msgId) ?? []
                  children.forEach((childId) => collectDescendants(childId))
                }
                collectDescendants(newData.id)

                // Filter out all messages that should be deleted
                return {
                  pages: old.pages.map((page) => ({
                    ...page,
                    messages: page.messages.filter((message) => !descendantIds.has(message.id)),
                  })),
                  pageParams: old.pageParams,
                }
              }

              // If deleteTrailing is false, handle single message deletion with parentId updates
              const targetMessage = old.pages
                .flatMap((page) => page.messages)
                .find((message) => message.id === newData.id)

              if (!targetMessage) {
                return old
              }

              const directChildrenCount = old.pages
                .flatMap((page) => page.messages)
                .filter((message) => message.parentId === newData.id).length

              if (directChildrenCount > 1 && !targetMessage.parentId) {
                // Cannot delete a root message without deleting its descendant messages
                return old
              }

              // Update parentId of direct children to point to the deleted message's parent
              // and remove the target message
              return {
                pages: old.pages.map((page) => ({
                  ...page,
                  messages: page.messages
                    .map((message) => {
                      // Update direct children's parentId
                      if (message.parentId === newData.id) {
                        return {
                          ...message,
                          parentId: targetMessage.parentId,
                        }
                      }
                      return message
                    })
                    .filter((message) => message.id !== newData.id), // Remove the target message
                })),
                pageParams: old.pageParams,
              }
            },
          )
        }

        return { previousData }
      },
      onError: (error, newData, context) => {
        // Rollback on error
        if (context?.previousData && chatId) {
          queryClient.setQueryData<InfiniteData<MessageListOutput>>(
            trpc.message.list.infiniteQueryKey({
              chatId,
              limit: PAGE_SIZE,
            }),
            context.previousData,
          )
        }
        toast.error(`Failed to delete message: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (
      id: string,
      {
        deleteTrailing,
        excludeSelf,
      }: {
        deleteTrailing?: boolean
        excludeSelf?: boolean
      } = {
        deleteTrailing: false,
        excludeSelf: false,
      },
    ) => {
      return await deleteMutation.mutateAsync({
        id,
        deleteTrailing,
        excludeSelf,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useCachedMessage(chat?: Chat) {
  const chatId = chat?.id

  const setFirstChat = useSetFirstChat(chat?.characterId ?? chat?.groupId)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const addCachedMessage = useCallback(
    async (message: Message) => {
      if (!chatId) return

      await queryClient.cancelQueries({
        queryKey: trpc.message.list.infiniteQueryKey({
          chatId,
          limit: PAGE_SIZE,
        }),
      })

      // Add the message to the infinite query cache
      queryClient.setQueryData<InfiniteData<MessageListOutput>>(
        trpc.message.list.infiniteQueryKey({
          chatId,
          limit: PAGE_SIZE,
        }),
        (old) => {
          if (!old) return undefined

          return {
            pages: old.pages.map((page, index) => {
              // Add the new message to the first page (most recent messages)
              if (index === 0) {
                return {
                  ...page,
                  messages: [message, ...page.messages],
                }
              }
              return page
            }),
            pageParams: old.pageParams,
          }
        },
      )

      void setFirstChat(chatId)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId, setFirstChat],
  )

  const updateCachedMessage = useCallback(
    async (message: Message) => {
      if (!chatId) return

      await queryClient.cancelQueries({
        queryKey: trpc.message.list.infiniteQueryKey({
          chatId,
          limit: PAGE_SIZE,
        }),
      })

      // Update the message in the infinite query cache
      queryClient.setQueryData<InfiniteData<MessageListOutput>>(
        trpc.message.list.infiniteQueryKey({
          chatId,
          limit: PAGE_SIZE,
        }),
        (old) => {
          if (!old) return undefined

          const oldMsg = old.pages
            .flatMap((page) => page.messages)
            .find((msg) => msg.id === message.id)
          if (hash(oldMsg) === hash(message)) {
            return old
          }

          return {
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) => (msg.id === message.id ? message : msg)),
            })),
            pageParams: old.pageParams,
          }
        },
      )

      void setFirstChat(chatId)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId, setFirstChat],
  )

  const removeCachedMessage = useCallback(
    async (messageId: string) => {
      if (!chatId) return

      await queryClient.cancelQueries({
        queryKey: trpc.message.list.infiniteQueryKey({
          chatId,
          limit: PAGE_SIZE,
        }),
      })

      // Remove the message from the infinite query cache
      queryClient.setQueryData<InfiniteData<MessageListOutput>>(
        trpc.message.list.infiniteQueryKey({
          chatId,
          limit: PAGE_SIZE,
        }),
        (old) => {
          if (!old) return undefined

          return {
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.filter((msg) => msg.id !== messageId),
            })),
            pageParams: old.pageParams,
          }
        },
      )

      void setFirstChat(chatId)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId, setFirstChat],
  )

  return {
    addCachedMessage,
    updateCachedMessage,
    removeCachedMessage,
  }
}
