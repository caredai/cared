import type { QueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { orpc } from '@/lib/orpc'

function invalidateOAuthAppQueries(queryClient: QueryClient, id?: string) {
  void queryClient.invalidateQueries(orpc.account.oauthApp.list.queryOptions())
  if (id) {
    void queryClient.invalidateQueries(
      orpc.account.oauthApp.get.queryOptions({ input: { id } }),
    )
  }
}

export function useListOAuthApps() {
  const {
    data: { oauthApps },
    refetch: refetchOAuthApps,
  } = useSuspenseQuery(orpc.account.oauthApp.list.queryOptions())

  return {
    oauthApps,
    refetchOAuthApps,
  }
}

export function useOAuthApp(id: string) {
  const {
    data: { oauthApp },
    refetch: refetchOAuthApp,
  } = useSuspenseQuery(
    orpc.account.oauthApp.get.queryOptions({
      input: { id },
    }),
  )

  return {
    oauthApp,
    refetchOAuthApp,
  }
}

export function useListOAuthAppScopes() {
  return useSuspenseQuery(orpc.account.oauthApp.listScopes.queryOptions())
}

export function useCreateOAuthApp() {
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    orpc.account.oauthApp.create.mutationOptions({
      onSuccess: () => {
        invalidateOAuthAppQueries(queryClient)
      },
      onError: (error) => {
        toast.error(`Failed to create OAuth app: ${error.message}`)
      },
    }),
  )

  return useCallback(
    (input: Parameters<typeof createMutation.mutateAsync>[0]) => createMutation.mutateAsync(input),
    [createMutation],
  )
}

export function useUpdateOAuthApp() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.oauthApp.update.mutationOptions({
      onSuccess: (_, variables) => {
        invalidateOAuthAppQueries(queryClient, variables.id)
      },
      onError: (error) => {
        toast.error(`Failed to update OAuth app: ${error.message}`)
      },
    }),
  )

  const updateOAuthApp = useCallback(
    (input: Parameters<typeof updateMutation.mutateAsync>[0]) => updateMutation.mutateAsync(input),
    [updateMutation],
  )

  return {
    updateOAuthApp,
    isUpdating: updateMutation.isPending,
  }
}

export function useRotateOAuthAppSecret() {
  const queryClient = useQueryClient()

  const rotateMutation = useMutation(
    orpc.account.oauthApp.rotateSecret.mutationOptions({
      onSuccess: (_, variables) => {
        invalidateOAuthAppQueries(queryClient, variables.id)
      },
      onError: (error) => {
        toast.error(`Failed to rotate client secret: ${error.message}`)
      },
    }),
  )

  const rotateOAuthAppSecret = useCallback(
    (id: string) => rotateMutation.mutateAsync({ id }),
    [rotateMutation],
  )

  return {
    rotateOAuthAppSecret,
    isRotating: rotateMutation.isPending,
  }
}

export function useDeleteOAuthApp() {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    orpc.account.oauthApp.delete.mutationOptions({
      onSuccess: () => {
        invalidateOAuthAppQueries(queryClient)
      },
      onError: (error) => {
        toast.error(`Failed to delete OAuth app: ${error.message}`)
      },
    }),
  )

  const deleteOAuthApp = useCallback(
    (id: string) => deleteMutation.mutateAsync({ id }),
    [deleteMutation],
  )

  return {
    deleteOAuthApp,
    isDeleting: deleteMutation.isPending,
  }
}
