import type { AppRouter } from '@tavern/api'
import type { LorebookEntry } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'
import hash from 'stable-hash'

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

export function useLorebook(id?: string) {
  const { lorebooks } = useLorebooks()

  const lorebook = useMemo(() => {
    return lorebooks.find((lorebook) => lorebook.id === id)
  }, [lorebooks, id])

  return {
    lorebook: lorebook,
  }
}

export function useCreateLorebook() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.lorebook.create.mutationOptions({
      onMutate: async (newData) => {
        await queryClient.cancelQueries({
          queryKey: trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        })

        const previousData = queryClient.getQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        )

        // Optimistically add the new lorebook
        queryClient.setQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
          (old) => {
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
          },
        )

        return { previousData }
      },
      onError: (error, newData, context) => {
        if (context) {
          queryClient.setQueryData(
            trpc.lorebook.list.queryKey({
              includeEntries: true,
            }),
            context.previousData,
          )
        }
        console.error('Failed to create lorebook:', error)
        toast.error(`Failed to create lorebook: ${error.message}`)
      },
      onSuccess: (data) => {
        // Update the temporary lorebook with the real one
        queryClient.setQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
          (old) => {
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
          },
        )
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
      await queryClient.cancelQueries({
        queryKey: trpc.lorebook.list.queryKey({
          includeEntries: true,
        }),
      })

      const previousData = queryClient.getQueryData(
        trpc.lorebook.list.queryKey({
          includeEntries: true,
        }),
      )

      queryClient.setQueryData(
        trpc.lorebook.list.queryKey({
          includeEntries: true,
        }),
        (old) => {
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
                ...newData,
              },
              ...old.lorebooks.slice(index + 1),
            ],
          }
        },
      )

      return { previousData }
    },
    onError: (error, newData, context) => {
      if (context) {
        queryClient.setQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
          context.previousData,
        )
      }
      console.error('Failed to update lorebook:', error)
      toast.error(`Failed to update lorebook: ${error.message}`)
    },
  })

  const mutationFnRef = useRef(mutationOptions.mutationFn)
  mutationFnRef.current = mutationOptions.mutationFn

  // @ts-ignore
  const mutationFn = useCallback((...args: any[]) => mutationFnRef.current?.(...args), [])

  mutationOptions.mutationFn = useMemo(
    () => pDebounce(mutationFn, debounceTimeout.extended),
    [mutationFn],
  )

  const mutation = useMutation(mutationOptions)

  const { lorebooks } = useLorebooks()

  return useCallback(
    async (args: { id: string; name?: string; entries?: LorebookEntry[] }) => {
      const lorebook = lorebooks.find((lorebook) => lorebook.id === args.id)
      if (!lorebook) {
        return
      }

      if (
        !(args.name && args.name !== lorebook.name) &&
        !(args.entries && hash(args.entries) !== hash(lorebook.entries))
      ) {
        // No changes to apply
        return
      }

      return await mutation.mutateAsync(structuredClone(args))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lorebooks],
  )
}

export function useDeleteLorebook() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.lorebook.delete.mutationOptions({
      onMutate: async (newData) => {
        await queryClient.cancelQueries({
          queryKey: trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        })

        const previousData = queryClient.getQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        )

        // Optimistically remove the lorebook
        queryClient.setQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
          (old) => {
            if (!old) {
              return undefined
            }
            return {
              lorebooks: old.lorebooks.filter((lorebook) => lorebook.id !== newData.id),
            }
          },
        )

        return { previousData }
      },
      onError: (error, newData, context) => {
        if (context) {
          queryClient.setQueryData(
            trpc.lorebook.list.queryKey({
              includeEntries: true,
            }),
            context.previousData,
          )
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
