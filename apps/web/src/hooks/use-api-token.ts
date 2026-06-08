import type { QueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { TokenPolicy } from '@cared/shared'

import { orpc } from '@/lib/orpc'

function invalidateApiTokenQueries(
  queryClient: QueryClient,
  options: {
    id?: string
    credentialType?: 'account' | 'user'
  } = {},
) {
  if (options.credentialType) {
    void queryClient.invalidateQueries(
      orpc.account.apiToken.list.queryOptions({
        input: {
          credentialType: options.credentialType,
        },
      }),
    )
  }

  if (options.id) {
    void queryClient.invalidateQueries(
      orpc.account.apiToken.get.queryOptions({
        input: { id: options.id },
      }),
    )
  }
}

export function useApiTokens(credentialType: 'account' | 'user' = 'account') {
  const {
    data: { tokens },
    refetch: refetchApiTokens,
  } = useSuspenseQuery(
    orpc.account.apiToken.list.queryOptions({
      input: {
        credentialType,
      },
    }),
  )

  return {
    apiTokens: tokens,
    refetchApiTokens,
  }
}

export function useApiToken(id: string) {
  const {
    data: { token },
    refetch: refetchApiToken,
  } = useSuspenseQuery(
    orpc.account.apiToken.get.queryOptions({
      input: { id },
    }),
  )

  return {
    apiToken: token,
    refetchApiToken,
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
    orpc.account.apiToken.create.mutationOptions({
      onSuccess: (_, variables) => {
        invalidateApiTokenQueries(queryClient, {
          credentialType: variables.credentialType,
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
      credentialType: 'account' | 'user'
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

export function useUpdateApiToken() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.apiToken.update.mutationOptions({
      onSuccess: (data, variables) => {
        invalidateApiTokenQueries(queryClient, {
          id: variables.id,
          credentialType: data.token.credentialType,
        })
      },
      onError: (error) => {
        console.error('Failed to update API token:', error)
        toast.error(`Failed to update API token: ${error.message}`)
      },
    }),
  )

  return {
    updateApiToken: useCallback(
      async (input: {
        id: string
        name?: string
        policies?: Omit<TokenPolicy, 'id'>[]
        enabled?: boolean
        expiresAt?: Date | null
        notBefore?: Date | null
      }) => {
        return await updateMutation.mutateAsync(input)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    ),
    isUpdating: updateMutation.isPending,
  }
}

export function useRotateApiToken() {
  const queryClient = useQueryClient()

  const rotateMutation = useMutation(
    orpc.account.apiToken.rotate.mutationOptions({
      onSuccess: (data, variables) => {
        invalidateApiTokenQueries(queryClient, {
          id: variables.id,
          credentialType: data.token.credentialType,
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
    orpc.account.apiToken.delete.mutationOptions({
      onSuccess: (data, variables) => {
        invalidateApiTokenQueries(queryClient, {
          id: variables.id,
          credentialType: data.token.credentialType,
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
  const { data } = useSuspenseQuery(orpc.account.apiToken.listPermissionGroups.queryOptions())
  return { data }
}
