import type { Settings } from '@tavern/core'
import { useCallback, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'

import { useTRPC } from '@/trpc/client'
import { debounceTimeout } from './debounce'

export function useUpdateSettingsMutation() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutationOptions = trpc.settings.update.mutationOptions({
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: trpc.settings.get.queryKey() })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(trpc.settings.get.queryKey())

      // Optimistically update to the new value
      queryClient.setQueryData(
        trpc.settings.get.queryKey(),
        (old) =>
          old && {
            settings: { ...old.settings, ...newData.settings },
          },
      )

      // Return a context object with the snapshotted value
      return { previousData }
    },
    onSuccess: (_data) => {
      // queryClient.setQueryData(trpc.settings.get.queryKey(), data)
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (error, newData, context) => {
      if (context) {
        queryClient.setQueryData(trpc.settings.get.queryKey(), context.previousData)
      }
      console.error('Failed to save settings:', error)
      toast.error(`Failed to save settings: ${error.message}`)
    },
    // Always refetch after error or success
    // onSettled: () => queryClient.invalidateQueries({ queryKey: trpc.settings.get.queryKey() }),
  })

  const mutationFnRef = useRef(mutationOptions.mutationFn)
  mutationFnRef.current = mutationOptions.mutationFn

  // @ts-ignore
  const mutationFn = useCallback((...args: any[]) => mutationFnRef.current?.(...args), [])

  // @ts-ignore
  mutationOptions.mutationFn = useMemo(
    () => pDebounce(mutationFn, debounceTimeout.relaxed),
    [mutationFn],
  )

  const mutation = useMutation(mutationOptions)
  const mutateAsync = mutation.mutateAsync
  mutation.mutateAsync = (variables) =>
    mutateAsync(variables, {
      onSuccess: (data) => {
        // Will execute only once, for the last mutation
        queryClient.setQueryData(trpc.settings.get.queryKey(), data)
      },
    })
  return mutation
}

export function useBackgroundSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }: { settings: Settings }) => settings.background, []),
  })
  return data
}

export function useAppearanceSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }: { settings: Settings }) => settings.appearance, []),
  })
  return data
}
