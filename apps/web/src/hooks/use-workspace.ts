import { useCallback, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import Cookies from 'js-cookie'

import { lastWorkspaceCookieName } from '@/lib/cookie'
import { orpc } from '@/lib/orpc'
import { stripIdPrefix } from '@/lib/utils'

export function useLastWorkspace() {
  const lastWorkspace = Cookies.get(lastWorkspaceCookieName)

  const setLastWorkspace = useCallback(
    (id?: string) =>
      id
        ? Cookies.set(lastWorkspaceCookieName, id, {
            expires: 30,
            secure: true,
          })
        : Cookies.remove(lastWorkspaceCookieName),
    [],
  )

  return [lastWorkspace, setLastWorkspace] as const
}

export type Workspace = ReturnType<typeof useWorkspaces>[number]

export function useAllWorkspaces() {
  const {
    data: { workspaces },
  } = useSuspenseQuery(orpc.workspace.list.queryOptions())

  return workspaces
}

export function useWorkspaces(organizationId?: string) {
  const allWorkspaces = useAllWorkspaces()
  return useMemo(() => {
    if (!organizationId) {
      return []
    }
    return allWorkspaces.filter((w) => w.organizationId === organizationId)
  }, [allWorkspaces, organizationId])
}

export function replaceRouteWithWorkspaceId(route: string, id: string) {
  return route.replace(/^\/workspace\/[^/]+/, `/workspace/${stripIdPrefix(id)}`)
}

export function useReplaceRouteWithWorkspaceId() {
  const router = useRouter()
  return useCallback(
    (id: string) => replaceRouteWithWorkspaceId(router.state.location.pathname, id),
    [router],
  )
}

export function useRedirectWorkspace(id: string) {
  const router = useRouter()

  return useCallback(() => {
    void router.navigate({ to: `/workspace/${stripIdPrefix(id)}/apps` })
  }, [router, id])
}
