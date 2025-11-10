import { useMemo } from 'react'
import { useLocation } from '@tanstack/react-router'

import { useAccounts } from '@/hooks/use-account'
import { useAllApps } from '@/hooks/use-app'
import { addIdPrefix } from '@/lib/utils'

export function useActive() {
  const location = useLocation()
  const pathname = location.pathname

  const activeApp = useApp(pathname)
  const activeAccount = useAccount(pathname, activeApp?.app.accountId)

  return {
    activeAccount,
    activeApp,
  }
}

export function useActiveAccount() {
  const location = useLocation()
  const pathname = location.pathname
  return useAccount(pathname)
}

export function useActiveApp() {
  const location = useLocation()
  const pathname = location.pathname
  return useApp(pathname)
}

function useAccount(pathname: string, id?: string) {
  const accounts = useAccounts()

  return useMemo(() => {
    const accountId = id ?? getAccountId(pathname)
    if (!accountId) {
      return
    }
    return accounts.find((account) => account.id === accountId)
  }, [accounts, pathname, id])
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

export function useActiveAppId() {
  const location = useLocation()
  const pathname = location.pathname
  return useMemo(
    () => ({
      activeAppId: getAppId(pathname),
      activeAppIdNoPrefix: getAppIdNoPrefix(pathname),
    }),
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

function getAppId(pathname: string) {
  const idNoPrefix = getAppIdNoPrefix(pathname)
  return idNoPrefix ? addIdPrefix(idNoPrefix, 'app') : ''
}

function getAppIdNoPrefix(pathname: string) {
  const matched = /\/acc_[^/]+\/app_([^/]+)/.exec(pathname)
  return matched?.length && matched[1] ? matched[1] : ''
}
