import type { AppRouter } from '@tavern/api'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback } from 'react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type ModelPreset = RouterOutput['modelPreset']['get']['modelPreset']

export function useModelPresets() {
  const trpc = useTRPC()

  const { data, refetch } = useSuspenseQuery({
    ...trpc.modelPreset.list.queryOptions(),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    modelPresets: data.modelPresets,
    refetchModelPresets: refetch,
  }
}

export function useCreateModelPreset() {
  const trpc = useTRPC()
  const { refetchModelPresets } = useModelPresets()

  const createMutation = useMutation(
    trpc.modelPreset.create.mutationOptions({
      onSuccess: () => {
        void refetchModelPresets()
      },
      onError: (error) => {
        toast.error(`Failed to create model preset: ${error.message}`)
      },
    }),
  )

  return useCallback(async (name: string, preset: ModelPreset['preset']) => {
    return await createMutation.mutateAsync({
      name,
      preset,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
