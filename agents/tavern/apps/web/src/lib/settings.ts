import { useCallback } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useTRPC } from '@/trpc/client'

export function useUpdateSettingsMutation() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation(
    trpc.settings.update.mutationOptions({
      onSuccess: (data) => {
        queryClient.setQueryData(trpc.settings.get.queryKey(), data)
      },
      onError: (error) => {
        console.error('Failed to save settings:', error)
        toast.error(`Failed to save settings: ${error.message}`)
      },
    }),
  )
}

export function useBackgroundSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }) => settings.background, []),
  })
  return data
}
