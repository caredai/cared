import type { AppRouter } from '@tavern/api'
import type { LorebookEntry, LorebookUpdates } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { updateLorebook } from '@tavern/core'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'

import { debounceTimeout } from '@/lib/debounce'
import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type Lorebook = RouterOutput['lorebook']['get']['lorebook']

export function useLorebooks() {
  const trpc = useTRPC()

  const { data, refetch } = useSuspenseQuery({
    ...trpc.lorebook.list.queryOptions({
      includeEntries: true,
    }),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    lorebooks: data.lorebooks as Lorebook[],
    refetchLorebooks: refetch,
  }
}

export function useLorebook(id: string) {
  const trpc = useTRPC()

  const { data } = useSuspenseQuery({
    ...trpc.lorebook.get.queryOptions({ id }),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    lorebook: data.lorebook,
  }
}

export function useCreateLorebook() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.lorebook.create.mutationOptions({
      onMutate: async (newData) => {
        await queryClient.cancelQueries({ queryKey: trpc.lorebook.list.queryKey() })

        const previousData = queryClient.getQueryData(trpc.lorebook.list.queryKey())

        // Optimistically add the new lorebook
        queryClient.setQueryData(trpc.lorebook.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }
          const newLorebook = {
            id: 'temp-id',
            name: newData.name,
            description: newData.description ?? null,
            entries: newData.entries ?? [],
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          return {
            lorebooks: [newLorebook, ...old.lorebooks],
          }
        })

        return { previousData }
      },
      onError: (error, newData, context) => {
        if (context) {
          queryClient.setQueryData(trpc.lorebook.list.queryKey(), context.previousData)
        }
        console.error('Failed to create lorebook:', error)
        toast.error(`Failed to create lorebook: ${error.message}`)
      },
      onSuccess: (data) => {
        // Update the temporary lorebook with the real one
        queryClient.setQueryData(trpc.lorebook.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }
          const index = old.lorebooks.findIndex((lorebook) => lorebook.id === 'temp-id')
          return {
            lorebooks: [
              ...old.lorebooks.slice(0, index),
              data.lorebook,
              ...old.lorebooks.slice(index + 1),
            ],
          }
        })
      },
    }),
  )

  return useCallback(async (name: string, description?: string, entries?: LorebookEntry[]) => {
    return await createMutation.mutateAsync({
      name,
      description,
      entries,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useUpdateLorebook() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutationOptions = trpc.lorebook.update.mutationOptions({
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: trpc.lorebook.list.queryKey() })

      const previousData = queryClient.getQueryData(trpc.lorebook.list.queryKey())

      queryClient.setQueryData(trpc.lorebook.list.queryKey(), (old) => {
        if (!old) {
          return undefined
        }
        const index = old.lorebooks.findIndex((lorebook) => lorebook.id === newData.id)
        const lorebook = old.lorebooks[index]! as Lorebook
        return {
          lorebooks: [
            ...old.lorebooks.slice(0, index),
            {
              ...lorebook,
              ...updateLorebook(lorebook, newData.updates).updates,
            },
            ...old.lorebooks.slice(index + 1),
          ],
        }
      })

      return { previousData }
    },
    onError: (error, newData, context) => {
      if (context) {
        queryClient.setQueryData(trpc.lorebook.list.queryKey(), context.previousData)
      }
      console.error('Failed to update lorebook:', error)
      toast.error(`Failed to update lorebook: ${error.message}`)
    },
  })

  const mutationFnRef = useRef(mutationOptions.mutationFn)
  mutationFnRef.current = mutationOptions.mutationFn

  // @ts-ignore
  const mutationFn = useCallback((...args: any[]) => mutationFnRef.current?.(...args), [])

  // @ts-ignore
  mutationOptions.mutationFn = useMemo(
    () => pDebounce(mutationFn, debounceTimeout.extended),
    [mutationFn],
  )

  const mutation = useMutation(mutationOptions)
  const mutateAsync = mutation.mutateAsync
  mutation.mutateAsync = (variables) => mutateAsync(variables)

  return useCallback(
    async (id: string, updates: LorebookUpdates) => {
      return await mutation.mutateAsync({
        id,
        updates,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useDeleteLorebook() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.lorebook.delete.mutationOptions({
      onMutate: async (newData) => {
        await queryClient.cancelQueries({ queryKey: trpc.lorebook.list.queryKey() })

        const previousData = queryClient.getQueryData(trpc.lorebook.list.queryKey())

        // Optimistically remove the lorebook
        queryClient.setQueryData(trpc.lorebook.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }
          return {
            lorebooks: old.lorebooks.filter((lorebook) => lorebook.id !== newData.id),
          }
        })

        return { previousData }
      },
      onError: (error, newData, context) => {
        if (context) {
          queryClient.setQueryData(trpc.lorebook.list.queryKey(), context.previousData)
        }
        console.error('Failed to delete lorebook:', error)
        toast.error(`Failed to delete lorebook: ${error.message}`)
      },
    }),
  )

  return useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync({
      id,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
