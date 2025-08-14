import { useCallback, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

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

export function replaceRouteWithOrganizationId(route: string, id: string) {
  return route.replace(/^\/org\/[^/]+/, `/org/${stripIdPrefix(id)}`)
}

export function useReplaceRouteWithOrganizationId() {
  const pathname = usePathname()
  return useCallback((id: string) => replaceRouteWithOrganizationId(pathname, id), [pathname])
}
