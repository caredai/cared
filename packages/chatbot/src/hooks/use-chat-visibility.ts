'use client'

import type { VisibilityType } from '@/components/visibility-selector'
import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useSWR, { useSWRConfig } from 'swr'

import type { Chat } from '@ownxai/db/schema'

import { useTRPC } from '@/lib/api'

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string
  initialVisibility: VisibilityType
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const updateChat = useMutation(
    trpc.chat.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.chat.list.queryKey(),
        })
      },
      onError: (err) => {
        console.error(
          err.data?.code === 'UNAUTHORIZED'
            ? 'You must be logged in to update chat'
            : 'Failed to update chat',
        )
      },
    }),
  )

  const { mutate, cache } = useSWRConfig()
  const history = cache.get('/api/history')?.data as Chat[] | undefined

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR<VisibilityType>(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibility,
    },
  )

  const visibilityType = useMemo(() => {
    if (!history) return localVisibility
    const chat = history.find((chat) => chat.id === chatId)
    if (!chat) return 'private'
    return chat.metadata.visibility as VisibilityType
  }, [history, chatId, localVisibility])

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    void setLocalVisibility(updatedVisibilityType)

    void mutate<Chat[]>(
      '/api/history',
      (history) => {
        return history
          ? history.map((chat) => {
              if (chat.id === chatId) {
                return {
                  ...chat,
                  visibility: updatedVisibilityType,
                }
              }
              return chat
            })
          : []
      },
      { revalidate: false },
    )

    updateChat.mutate({
      id: chatId,
      metadata: {
        visibility: updatedVisibilityType,
      },
    })
  }

  return { visibilityType, setVisibilityType }
}
