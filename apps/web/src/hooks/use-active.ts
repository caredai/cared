import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

import { useOrganizations } from '@/hooks/use-organization'
import { useAllWorkspaces } from '@/hooks/use-workspace'
import { addIdPrefix } from '@/lib/utils'

export function useActive() {
  const pathname = usePathname()

  const activeWorkspace = useWorkspace(pathname)
  const activeOrganization = useOrganization(pathname, activeWorkspace?.id)

  return {
    activeOrganization,
    activeWorkspace,
  }
}

export function useActiveOrganization() {
  const { activeOrganization } = useActive()
  return {
    activeOrganization: activeOrganization!,
  }
}

export function useActiveWorkspace() {
  const { activeWorkspace } = useActive()
  return {
    activeWorkspace: activeWorkspace!,
  }
}

function useWorkspace(pathname: string) {
  const workspaces = useAllWorkspaces()

  return useMemo(() => {
    const id = getWorkspaceId(pathname)
    return workspaces.find((w) => w.id === id)
  }, [workspaces, pathname])
}

function useOrganization(pathname: string, id?: string) {
  const organizations = useOrganizations()

  return useMemo(() => {
    const orgId = id ?? getOrganizationId(pathname)
    if (!orgId) {
      return
    }
    return organizations.find((org) => org.id === orgId)
  }, [organizations, pathname, id])
}

export function useActiveOrganizationId() {
  const pathname = usePathname()
  return useMemo(
    () => ({
      activeOrganizationId: getOrganizationId(pathname),
      activeOrganizationIdNoPrefix: getOrganizationIdNoPrefix(pathname),
    }),
    [pathname],
  )
}

export function useActiveWorkspaceId() {
  const pathname = usePathname()
  return useMemo(
    () => ({
      activeWorkspaceId: getWorkspaceId(pathname),
      activeWorkspaceIdNoPrefix: getWorkspaceIdNoPrefix(pathname),
    }),
    [pathname],
  )
}

function getOrganizationId(pathname: string) {
  const idNoPrefix = getOrganizationIdNoPrefix(pathname)
  return idNoPrefix ? addIdPrefix(idNoPrefix, 'org') : ''
}

function getOrganizationIdNoPrefix(pathname: string) {
  const matched = /\/org\/([^/]+)/.exec(pathname)
  return matched?.length && matched[1] ? matched[1] : ''
}

function getWorkspaceId(pathname: string) {
  const idNoPrefix = getWorkspaceIdNoPrefix(pathname)
  return idNoPrefix ? addIdPrefix(idNoPrefix, 'workspace') : ''
}

function getWorkspaceIdNoPrefix(pathname: string) {
  const matched = /\/workspace\/([^/]+)/.exec(pathname)
  return matched?.length && matched[1] ? matched[1] : ''
}
