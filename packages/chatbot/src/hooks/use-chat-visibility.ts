'use client'

import type { VisibilityType } from '@/components/visibility-selector'
import { useMemo } from 'react'
import useSWR, { useSWRConfig } from 'swr'

import type { Chat } from '@mindworld/db/schema'

import { useAPI } from '@/lib/api'

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string
  initialVisibility: VisibilityType
}) {
  const api = useAPI()
  const utils = api.useUtils()
  const updateChat = api.chat.update.useMutation({
    onSuccess: async () => {
      await utils.chat.invalidate()
    },
    onError: (err) => {
      console.error(
        err.data?.code === 'UNAUTHORIZED'
          ? 'You must be logged in to update chat'
          : 'Failed to update chat',
      )
    },
  })

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
    return chat.visibility as VisibilityType
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
      visibility: updatedVisibilityType,
    })
  }

  return { visibilityType, setVisibilityType }
}
