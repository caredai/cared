import { useCallback, useMemo } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ProviderId, ProviderKey } from '@cared/providers'

import { useTRPC } from '@/trpc/client'

export function useProviderKeys(input?: {
  isSystem?: boolean
  organizationId?: string
  providerId?: ProviderId
}) {
  const trpc = useTRPC()

  const {
    data: { providerKeys },
    refetch: refetchProviderKeys,
  } = useSuspenseQuery(
    trpc.providerKey.list.queryOptions({
      isSystem: input?.isSystem,
      organizationId: input?.organizationId,
      providerId: input?.providerId,
    }),
  )

  return {
    providerKeys,
    refetchProviderKeys,
  }
}

export function useSystemProviderKeys() {
  return useProviderKeys({ isSystem: true })
}

export function useOrganizationProviderKeys(organizationId: string) {
  return useProviderKeys({ organizationId })
}

export function useUserProviderKeys() {
  return useProviderKeys()
}

export function useProviderKeysByProvider(providerId?: string) {
  const { providerKeys, refetchProviderKeys } = useProviderKeys()

  const filteredProviderKeys = useMemo(() => {
    if (!providerId) {
      return []
    }

    return providerKeys.filter((key) => key.providerId === providerId)
  }, [providerId, providerKeys])

  return {
    providerKeys: filteredProviderKeys,
    refetchProviderKeys,
  }
}

export function useCreateProviderKey() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.providerKey.create.mutationOptions({
      onSuccess: (_, variables) => {
        void queryClient.invalidateQueries({
          queryKey: trpc.providerKey.list.queryOptions({
            isSystem: variables.isSystem,
            organizationId: variables.organizationId,
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
    async (input: {
      isSystem?: boolean
      organizationId?: string
      key: ProviderKey
      disabled?: boolean
    }) => {
      return await createMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useUpdateProviderKey() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.providerKey.update.mutationOptions({
      onSuccess: ({ providerKey }) => {
        void queryClient.invalidateQueries({
          queryKey: trpc.providerKey.list.queryOptions({
            isSystem: providerKey.isSystem ?? undefined,
            organizationId: providerKey.organizationId ?? undefined,
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
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.providerKey.delete.mutationOptions({
      onSuccess: ({ providerKey }) => {
        void queryClient.invalidateQueries({
          queryKey: trpc.providerKey.list.queryOptions({
            isSystem: providerKey.isSystem ?? undefined,
            organizationId: providerKey.organizationId ?? undefined,
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
