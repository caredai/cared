import { useCallback, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { authClient } from '@cared/auth/client'

import { useSession } from '@/hooks/use-user'
import { addIdPrefix, stripIdPrefix } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'

export function useOrganizationId() {
  const pathname = usePathname()
  const matched = /\/org\/([^/]+)/.exec(pathname)
  return matched?.length && matched[1] ? addIdPrefix(matched[1], 'org') : ''
}

export function useOrganization() {
  const router = useRouter()

  const id = useOrganizationId()

  const trpc = useTRPC()
  const {
    data: { organization },
    error,
  } = useSuspenseQuery({
    ...trpc.organization.get.queryOptions({
      id,
    }),
    retry: (failureCount, error) => {
      return !(id.length < 32 || error.data?.code === 'NOT_FOUND')
    },
  })

  useEffect(() => {
    if (id.length < 32 || error?.data?.code === 'NOT_FOUND') {
      console.error('Organization not found', { id, error })
      toast.error('Organization not found')
      router.replace('/')
    }
  }, [id, error, router])

  return organization
}


export type Organization = ReturnType<typeof useOrganization>

export function useLastOrganization() {
  const { session } = useSession()
  return session.activeOrganizationId ?? undefined
}

export function useSetLastOrganization() {
  return useCallback(async (id?: string) => {
    await authClient.organization.setActive({
      organizationId: id ?? null,
    })
  }, [])
}

export function useOrganizations() {
  const trpc = useTRPC()

  const {
    data: { organizations },
  } = useSuspenseQuery(trpc.organization.list.queryOptions())

  const lastOrganization = useLastOrganization()
  const setLastOrganization = useSetLastOrganization()

  useEffect(() => {
    if (
      !lastOrganization || // set last organization if it is not set
      !organizations.some((org) => org.id === lastOrganization) // or if the last organization is not in the list
    ) {
      void setLastOrganization(organizations.at(0)?.id)
    }
  }, [organizations, lastOrganization, setLastOrganization])

  return organizations
}

export function replaceRouteWithOrganizationId(route: string, id: string) {
  return route.replace(/^\/org\/[^/]+/, `/org/${stripIdPrefix(id)}`)
}

export function useReplaceRouteWithOrganizationId() {
  const pathname = usePathname()
  return useCallback((id: string) => replaceRouteWithOrganizationId(pathname, id), [pathname])
}
