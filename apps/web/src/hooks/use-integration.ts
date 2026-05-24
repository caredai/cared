import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import type { RouterOutputs } from '@cared/api'

import { orpc, orpcClient } from '@/lib/orpc'

export type Integration = RouterOutputs['account']['integration']['list']['integrations'][number]

export type IntegrationType = 'github' | 'cloudflare'

/**
 * List integrations, optionally filtered by type.
 */
export function useIntegrations(type?: IntegrationType) {
  const { data, isLoading } = useQuery(
    orpc.account.integration.list.queryOptions({
      input: type ? { type } : {},
    }),
  )

  return {
    integrations: data?.integrations ?? [],
    isLoading,
  }
}

/**
 * Delete an integration by id. Invalidates integration list on success.
 */
export function useDeleteIntegration() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.account.integration.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.account.integration.list.key() })
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to remove integration')
      },
    }),
  )

  const deleteIntegration = useCallback(
    async (id: string) => {
      return await mutation.mutateAsync({ id })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return {
    deleteIntegration,
    isDeleting: mutation.isPending,
  }
}

/**
 * Add a Cloudflare integration by API token. Invalidates integration list on success.
 */
export function useAddCloudflare() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.account.integration.addCloudflare.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.account.integration.list.key() })
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to add Cloudflare integration')
      },
    }),
  )

  const addCloudflare = useCallback(
    async (apiToken: string) => {
      return await mutation.mutateAsync({ apiToken })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return {
    addCloudflare,
    isAdding: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Get GitHub installation URL and redirect. Returns mutation for triggering and pending state.
 */
export function useGithubInstallationUrl() {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: async () => {
      const redirectUrl = `${window.location.origin}${router.state.location.pathname}`
      const result = await orpcClient.account.integration.getGithubInstallationUrl.call({
        input: { redirectUrl },
      })
      return result
    },
    onSuccess: (result) => {
      window.location.href = result.url
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to get GitHub installation URL')
    },
  })

  return {
    redirectToGithub: mutation.mutate,
    isPending: mutation.isPending,
  }
}
