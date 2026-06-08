import { useCallback, useMemo } from 'react'
import { useLocation } from '@tanstack/react-router'

import { useAccounts } from '@/hooks/use-account'
import { useDatabaseNamespaces } from '@/hooks/use-database'
import { addIdPrefix, stripIdPrefix } from '@/lib/utils'

export function useActive() {
  const location = useLocation()
  const pathname = location.pathname

  const activeAccount = useAccount(pathname)
  const activeDatabaseNamespace = useDatabaseNamespace(pathname)

  return {
    activeAccount,
    activeDatabaseNamespace,
  }
}

export function useActiveAccount() {
  const location = useLocation()
  const pathname = location.pathname
  return useAccount(pathname)
}

export function useActiveDatabaseNamespace() {
  const location = useLocation()
  const pathname = location.pathname
  return useDatabaseNamespace(pathname)
}

function useAccount(pathname: string) {
  const accounts = useAccounts()

  return useMemo(() => {
    const accountId = getAccountId(pathname)
    if (!accountId) {
      return
    }
    return accounts.find((account) => account.id === accountId)
  }, [accounts, pathname])
}

function useDatabaseNamespace(pathname: string) {
  const namespaces = useDatabaseNamespaces()

  return useMemo(() => {
    const databaseNamespaceId = getDatabaseNamespaceId(pathname)
    if (!databaseNamespaceId) {
      return
    }
    return namespaces.find((namespace) => namespace.id === databaseNamespaceId)
  }, [namespaces, pathname])
}

export function useActiveAccountId() {
  const location = useLocation()
  const pathname = location.pathname
  return useMemo(
    () => ({
      activeAccountId: getAccountId(pathname),
      activeAccountIdNoPrefix: getAccountIdNoPrefix(pathname),
    }),
    [pathname],
  )
}

export function useActiveDatabaseNamespaceId() {
  const location = useLocation()
  const pathname = location.pathname
  return useMemo(
    () => ({
      activeDatabaseNamespaceId: getDatabaseNamespaceId(pathname),
      activeDatabaseNamespaceIdNoPrefix: getDatabaseNamespaceIdNoPrefix(pathname),
    }),
    [pathname],
  )
}

export function replaceRouteWithAccountId(route: string, id: string) {
  return route.replace(/^\/acc_[^/]+/, `/acc_${stripIdPrefix(id)}`)
}

export function useReplaceRouteWithAccountId() {
  const location = useLocation()
  const pathname = location.pathname
  return useCallback((id: string) => replaceRouteWithAccountId(pathname, id), [pathname])
}

export function replaceRouteWithDatabaseNamespaceId(route: string, namespaceId: string) {
  return route.replace(/\/database_[^/]+/, `/database_${stripIdPrefix(namespaceId)}`)
}

export function useReplaceRouteWithDatabaseNamespaceId() {
  const location = useLocation()
  const pathname = location.pathname
  return useCallback(
    (namespaceId: string) => replaceRouteWithDatabaseNamespaceId(pathname, namespaceId),
    [pathname],
  )
}

function getAccountId(pathname: string) {
  const idNoPrefix = getAccountIdNoPrefix(pathname)
  return idNoPrefix ? addIdPrefix(idNoPrefix, 'acc') : ''
}

function getAccountIdNoPrefix(pathname: string) {
  const matched = /\/acc_([^/]+)/.exec(pathname)
  return matched?.length && matched[1] ? matched[1] : ''
}

function getDatabaseNamespaceId(pathname: string) {
  const idNoPrefix = getDatabaseNamespaceIdNoPrefix(pathname)
  return idNoPrefix ? addIdPrefix(idNoPrefix, 'neon') : ''
}

function getDatabaseNamespaceIdNoPrefix(pathname: string) {
  const matched = /\/acc_[^/]+\/database_([^/]+)/.exec(pathname)
  return matched?.length && matched[1] ? matched[1] : ''
}
