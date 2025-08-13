import { useCallback, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSuspenseQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'

import { lastWorkspaceCookieName } from '@/lib/cookie'
import { addIdPrefix, stripIdPrefix } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'

export function useWorkspaceId() {
  const pathname = usePathname()
  const matched = /\/workspace\/([^/]+)/.exec(pathname)
  return matched?.length && matched[1] ? addIdPrefix(matched[1], 'workspace') : ''
}

export function useWorkspace() {
  const id = useWorkspaceId()

  const workspaces = useAllWorkspaces()

  const workspace = useMemo(() => workspaces.find((w) => w.id === id), [workspaces, id])

  return workspace
}

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
  const trpc = useTRPC()

  const {
    data: { workspaces },
  } = useSuspenseQuery(trpc.workspace.list.queryOptions())

  const [workspace, setWorkspace] = useLastWorkspace()
  useEffect(() => {
    if (!workspace) {
      // Set last workspace if it's not already set
      setWorkspace(workspaces.at(0)?.id)
    } else if (!workspaces.some((w) => w.id === workspace)) {
      // If the last workspace is not in the list of workspaces, reset it
      setWorkspace(workspaces.at(0)?.id)
    }
  }, [workspaces, workspace, setWorkspace])

  return workspaces
}

export function useWorkspaces(organizationId: string) {
  const allWorkspaces = useAllWorkspaces()
  return useMemo(
    () => allWorkspaces.filter((w) => w.organizationId === organizationId),
    [allWorkspaces],
  )
}

export function replaceRouteWithWorkspaceId(route: string, id: string) {
  return route.replace(/^\/workspace\/[^/]+/, `/workspace/${stripIdPrefix(id)}`)
}

export function useReplaceRouteWithWorkspaceId() {
  const pathname = usePathname()
  return useCallback((id: string) => replaceRouteWithWorkspaceId(pathname, id), [pathname])
}

export function useRedirectWorkspace(id: string) {
  const router = useRouter()

  return useCallback(() => {
    router.replace(`/workspace/${stripIdPrefix(id)}/apps`)
  }, [router, id])
}
