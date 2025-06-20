import type { InfiniteData } from '@tanstack/react-query'
import type { AppRouter } from '@tavern/api'
import type { Message, MessageAnnotation } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback } from 'react'
import { skipToken, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import hash from 'stable-hash'

import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
type MessageListOutput = RouterOutput['message']['list']

const PAGE_SIZE = 10

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
    async (
      id: string,
      {
        content,
        annotation,
      }: {
        content?: string
        annotation?: MessageAnnotation
      },
    ) => {
      const message = messages?.pages
        .flatMap((page) => page.messages)
        .find((message) => message.id === id)
      if (!message) {
        return
      }

      let found = false
      const parts = message.content.parts.map((part) => {
        if (part.type === 'text' && !found) {
          found = true
          return {
            ...part,
            text: content ?? part.text,
          }
        }
        return part
      })

      const annotations: [MessageAnnotation] = annotation ? [annotation] : message.content.annotations

      if (
        (!content || hash(parts) === hash(message.content.parts)) &&
        (!annotation || hash(annotations) === hash(message.content.annotations))
      ) {
        return
      }

      return await updateMutation.mutateAsync({
        id,
        content: {
          ...message.content,
          parts,
          annotations,
        },
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

              // If deleteTrailing is false, only delete the specified message
              return {
                pages: old.pages.map((page) => ({
                  ...page,
                  messages: page.messages.filter((message) => message.id !== newData.id),
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
