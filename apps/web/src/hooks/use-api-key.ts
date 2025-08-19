import { useCallback, useMemo } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiKeyMetadata } from '@cared/api'

import { useTRPC } from '@/trpc/client'

export function useApiKeys() {
  const trpc = useTRPC()

  const {
    data: { keys },
    refetch: refetchApiKeys,
  } = useSuspenseQuery(trpc.apiKey.list.queryOptions())

  return {
    apiKeys: keys,
    refetchApiKeys,
  }
}

export function useUserApiKeys() {
  const { apiKeys, refetchApiKeys } = useApiKeys()

  const filteredApiKeys = useMemo(() => {
    return apiKeys.filter((key) => key.scope === 'user')
  }, [apiKeys])

  return {
    apiKeys: filteredApiKeys,
    refetchApiKeys,
  }
}

export function useOrganizationApiKeys(organizationId?: string) {
  const { apiKeys, refetchApiKeys } = useApiKeys()

  const filteredApiKeys = useMemo(() => {
    if (!organizationId) {
      return []
    }
    return apiKeys.filter(
      (key) => key.scope === 'organization' && key.organizationId === organizationId,
    )
  }, [apiKeys, organizationId])

  return {
    apiKeys: filteredApiKeys,
    refetchApiKeys,
  }
}

export function useWorkspaceApiKeys(workspaceId?: string) {
  const { apiKeys, refetchApiKeys } = useApiKeys()

  const filteredApiKeys = useMemo(() => {
    if (!workspaceId) {
      return []
    }
    return apiKeys.filter((key) => key.scope === 'workspace' && key.workspaceId === workspaceId)
  }, [apiKeys, workspaceId])

  return {
    apiKeys: filteredApiKeys,
    refetchApiKeys,
  }
}

export function useAppApiKeys(appId?: string) {
  const { apiKeys, refetchApiKeys } = useApiKeys()

  const filteredApiKeys = useMemo(() => {
    if (!appId) {
      return []
    }
    return apiKeys.filter((key) => key.scope === 'app' && key.appId === appId)
  }, [apiKeys, appId])

  return {
    apiKeys: filteredApiKeys,
    refetchApiKeys,
  }
}

export function useCreateApiKey() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.apiKey.create.mutationOptions({
      onSuccess: () => {
        // Invalidate all API key queries since we're doing full query now
        void queryClient.invalidateQueries({
          queryKey: trpc.apiKey.list.queryOptions().queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to create API key:', error)
        toast.error(`Failed to create API key: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (
      input: {
        name: string
      } & ApiKeyMetadata,
    ) => {
      return await createMutation.mutateAsync(input)
    },
    [createMutation],
  )
}

export function useRotateApiKey() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const rotateMutation = useMutation(
    trpc.apiKey.rotate.mutationOptions({
      onSuccess: () => {
        // Invalidate all API key queries since we're doing full query now
        void queryClient.invalidateQueries({
          queryKey: trpc.apiKey.list.queryOptions().queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to rotate API key:', error)
        toast.error(`Failed to rotate API key: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string) => {
      return await rotateMutation.mutateAsync({ id })
    },
    [rotateMutation],
  )
}

export function useDeleteApiKey() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.apiKey.delete.mutationOptions({
      onSuccess: () => {
        // Invalidate all API key queries since we're doing full query now
        void queryClient.invalidateQueries({
          queryKey: trpc.apiKey.list.queryOptions().queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to delete API key:', error)
        toast.error(`Failed to delete API key: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string) => {
      return await deleteMutation.mutateAsync({ id })
    },
    [deleteMutation],
  )
}
