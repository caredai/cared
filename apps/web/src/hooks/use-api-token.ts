import { useCallback } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { TokenPolicy } from '@cared/shared'

import { orpc } from '@/lib/orpc'

export function useApiTokens(scope: 'account' | 'user' = 'account') {
  const {
    data: { tokens },
    refetch: refetchApiTokens,
  } = useSuspenseQuery(
    orpc.apiToken.list.queryOptions({
      input: {
        scope,
      },
    }),
  )

  return {
    apiTokens: tokens,
    refetchApiTokens,
  }
}

export function useAccountApiTokens() {
  return useApiTokens('account')
}

export function useUserApiTokens() {
  return useApiTokens('user')
}

export function useCreateApiToken() {
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    orpc.apiToken.create.mutationOptions({
      onSuccess: (_, variables) => {
        void queryClient.invalidateQueries({
          queryKey: orpc.apiToken.list.queryOptions({
            input: {
              scope: variables.scope,
            },
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to create API token:', error)
        toast.error(`Failed to create API token: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: {
      name: string
      scope: 'account' | 'user'
      policies: Omit<TokenPolicy, 'id'>[]
      enabled?: boolean
      expiresAt?: Date
      notBefore?: Date
    }) => {
      return await createMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useRotateApiToken() {
  const queryClient = useQueryClient()

  const rotateMutation = useMutation(
    orpc.apiToken.rotate.mutationOptions({
      onSuccess: (data) => {
        void queryClient.invalidateQueries({
          queryKey: orpc.apiToken.list.queryOptions({
            input: {
              scope: !data.token.userId ? 'account' : 'user',
            },
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to rotate API token:', error)
        toast.error(`Failed to rotate API token: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string) => {
      return await rotateMutation.mutateAsync({ id })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useDeleteApiToken() {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    orpc.apiToken.delete.mutationOptions({
      onSuccess: (data) => {
        void queryClient.invalidateQueries({
          queryKey: orpc.apiToken.list.queryOptions({
            input: {
              scope: !data.token.userId ? 'account' : 'user',
            },
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to delete API token:', error)
        toast.error(`Failed to delete API token: ${error.message}`)
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

export function useListPermissionGroups() {
  const { data } = useSuspenseQuery(
    orpc.apiToken.listPermissionGroups.queryOptions(),
  )
  return { data }
}
