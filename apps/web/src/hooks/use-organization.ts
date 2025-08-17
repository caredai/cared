import { useCallback, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSession, useSessionPublic } from '@/hooks/use-session'
import { stripIdPrefix } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'

export type Organization = ReturnType<typeof useOrganizations>[number]

export function useLastOrganization() {
  const { session } = useSession()
  return session.activeOrganizationId ?? undefined
}

export function useSetLastOrganization() {
  const { session, refetchSession } = useSessionPublic()

  const trpc = useTRPC()

  const setActiveMutation = useMutation(trpc.organization.setActive.mutationOptions())

  const [disabledSetLastOrganization, setDisabledSetLastOrganization] = useState(false)

  const setLastOrganization = useCallback(async (id?: string, disable?: boolean) => {
    if (id === (session?.activeOrganizationId ?? undefined)) {
      return
    }
    console.log('set active organization', id)
    await setActiveMutation.mutateAsync({
      organizationId: id ?? null,
    })
    if (disable) {
      setDisabledSetLastOrganization(true)
    }
    await refetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    setLastOrganization,
    disabledSetLastOrganization,
  }
}

export function useOrganizations() {
  const trpc = useTRPC()

  const {
    data: { organizations },
  } = useSuspenseQuery(trpc.organization.list.queryOptions())

  return organizations
}

/**
 * Hook for updating organization information
 * Provides mutation for updating organization name and other properties
 */
export function useUpdateOrganization() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.organization.update.mutationOptions({
      onSuccess: () => {
        // Invalidate organization queries to refresh data
        void queryClient.invalidateQueries(trpc.organization.list.queryOptions())
      },
      onError: (error) => {
        console.error('Failed to update organization:', error)
        toast.error('Failed to update organization')
      },
    }),
  )

  return useCallback(
    async (input: { id: string; name: string }) => {
      return await updateMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Hook for transferring organization ownership to another member
 * Provides mutation for transferring ownership between members
 */
export function useTransferOrganizationOwnership() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const transferMutation = useMutation(
    trpc.organization.transferOwnership.mutationOptions({
      onSuccess: () => {
        // Invalidate organization queries to refresh data
        void queryClient.invalidateQueries(trpc.organization.list.queryOptions())
      },
      onError: (error) => {
        console.error('Failed to transfer organization ownership:', error)
        toast.error('Failed to transfer organization ownership')
      },
    }),
  )

  return useCallback(
    async (input: { organizationId: string; memberId: string }) => {
      return await transferMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function replaceRouteWithOrganizationId(route: string, id: string) {
  return route.replace(/^\/org\/[^/]+/, `/org/${stripIdPrefix(id)}`)
}

export function useReplaceRouteWithOrganizationId() {
  const pathname = usePathname()
  return useCallback((id: string) => replaceRouteWithOrganizationId(pathname, id), [pathname])
}
