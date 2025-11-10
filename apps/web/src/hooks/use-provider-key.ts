import { useCallback, useMemo } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ProviderId, ProviderKey } from '@cared/providers'

import { orpc } from '@/lib/orpc'

export type ModelSource = 'custom' | 'system'

export function useProviderKeys({ source }: { source: ModelSource }) {
  const {
    data: { providerKeys },
    refetch: refetchProviderKeys,
  } = useSuspenseQuery(
    orpc.providerKey.list.queryOptions({
      input: {
        source,
      },
    }),
  )

  return {
    providerKeys,
    refetchProviderKeys,
  }
}

export function useProviderKeysByProvider({
  source,
  providerId,
}: {
  source: ModelSource
  providerId: ProviderId
}) {
  const { providerKeys, refetchProviderKeys } = useProviderKeys({ source })

  const filteredProviderKeys = useMemo(() => {
    return providerKeys.filter((key) => key.providerId === providerId)
  }, [providerId, providerKeys])

  return {
    providerKeys: filteredProviderKeys,
    refetchProviderKeys,
  }
}

export function useCreateProviderKey({ source }: { source: ModelSource }) {
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    orpc.providerKey.create.mutationOptions({
      onSuccess: (_, variables) => {
        void queryClient.invalidateQueries({
          queryKey: orpc.providerKey.list.queryOptions({
            input: {
              source: variables.source,
            },
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to create provider key:', error)
        toast.error(`Failed to create provider key: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { key: ProviderKey; disabled?: boolean }) => {
      return await createMutation.mutateAsync({
        source,
        ...input,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  )
}

export function useUpdateProviderKey() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.providerKey.update.mutationOptions({
      onSuccess: () => {
        // Invalidate both custom and system queries as we don't know which one was updated
        void queryClient.invalidateQueries({
          queryKey: orpc.providerKey.list.queryOptions({
            input: {
              source: 'custom',
            },
          }).queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: orpc.providerKey.list.queryOptions({
            input: {
              source: 'system',
            },
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to update provider key:', error)
        toast.error(`Failed to update provider key: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { id: string; key?: ProviderKey; disabled?: boolean }) => {
      return await updateMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useDeleteProviderKey() {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    orpc.providerKey.delete.mutationOptions({
      onSuccess: () => {
        // Invalidate both custom and system queries as we don't know which one was deleted
        void queryClient.invalidateQueries({
          queryKey: orpc.providerKey.list.queryOptions({
            input: {
              source: 'custom',
            },
          }).queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: orpc.providerKey.list.queryOptions({
            input: {
              source: 'system',
            },
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to delete provider key:', error)
        toast.error(`Failed to delete provider key: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string) => {
      return await deleteMutation.mutateAsync({ id })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

// Utility hooks for common operations
export function useToggleProviderKey() {
  const updateProviderKey = useUpdateProviderKey()

  return useCallback(
    async (id: string, disabled: boolean) => {
      return await updateProviderKey({ id, disabled })
    },
    [updateProviderKey],
  )
}

export function useEnableProviderKey() {
  const toggleProviderKey = useToggleProviderKey()

  return useCallback(
    async (id: string) => {
      return await toggleProviderKey(id, false)
    },
    [toggleProviderKey],
  )
}

export function useDisableProviderKey() {
  const toggleProviderKey = useToggleProviderKey()

  return useCallback(
    async (id: string) => {
      return await toggleProviderKey(id, true)
    },
    [toggleProviderKey],
  )
}
