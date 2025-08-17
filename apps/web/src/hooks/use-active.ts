import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

import { useAllApps } from '@/hooks/use-app'
import { useOrganizations } from '@/hooks/use-organization'
import { useAllWorkspaces } from '@/hooks/use-workspace'
import { addIdPrefix } from '@/lib/utils'

export function useActive() {
  const pathname = usePathname()

  const activeApp = useApp(pathname)
  const activeWorkspace = useWorkspace(pathname, activeApp?.app.workspaceId)
  const activeOrganization = useOrganization(pathname, activeWorkspace?.organizationId)

  return {
    activeOrganization,
    activeWorkspace,
    activeApp,
  }
}

export function useActiveOrganization() {
  const pathname = usePathname()
  return useOrganization(pathname)
}

export function useActiveWorkspace() {
  const pathname = usePathname()
  return useWorkspace(pathname)
}

export function useActiveApp() {
  const pathname = usePathname()
  return useApp(pathname)
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

function useWorkspace(pathname: string, id?: string) {
  const workspaces = useAllWorkspaces()

  return useMemo(() => {
    const workspaceId = id ?? getWorkspaceId(pathname)
    if (!workspaceId) {
      return
    }
    return workspaces.find((w) => w.id === workspaceId)
  }, [workspaces, pathname, id])
}

function useApp(pathname: string, id?: string) {
  const apps = useAllApps()

  return useMemo(() => {
    const appId = id ?? getAppId(pathname)
    if (!appId) {
      return
    }
    return apps.find((a) => a.app.id === appId)
  }, [apps, pathname, id])
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

export function useActiveAppId() {
  const pathname = usePathname()
  return useMemo(
    () => ({
      activeAppId: getAppId(pathname),
      activeAppIdNoPrefix: getAppIdNoPrefix(pathname),
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

function getAppId(pathname: string) {
  const idNoPrefix = getAppIdNoPrefix(pathname)
  return idNoPrefix ? addIdPrefix(idNoPrefix, 'app') : ''
}

function getAppIdNoPrefix(pathname: string) {
  const matched = /\/app\/([^/]+)/.exec(pathname)
  return matched?.length && matched[1] ? matched[1] : ''
}
