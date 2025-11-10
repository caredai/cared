import { useCallback, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useLocation } from '@tanstack/react-router'

import { orpc } from '@/lib/orpc'
import { stripIdPrefix } from '@/lib/utils'

export function useAllApps() {
  const {
    data: { apps },
  } = useSuspenseQuery(orpc.app.list.queryOptions({
    input: {
      all: true
    }
  }))

  return apps
}

export function useApps({ accountId }: { accountId?: string }) {
  const apps = useAllApps()

  return useMemo(() => {
    if (accountId) {
      return apps.filter((app) => app.app.accountId === accountId)
    }
    return []
  }, [accountId, apps])
}

export function useAppsByCategories({
  accountId,
  categories,
}: {
  accountId: string
  categories: Set<string>
}) {
  const apps = useApps({ accountId })

  return useMemo(
    () => apps.filter((app) => app.categories.some((c) => categories.has(c.id))),
    [apps, categories],
  )
}

export function useAppsByTags({ accountId, tags }: { accountId: string; tags: Set<string> }) {
  const apps = useApps({ accountId })

  return useMemo(() => apps.filter((app) => app.tags.some((t) => tags.has(t))), [apps, tags])
}

export function replaceRouteWithAppId(route: string, id: string) {
  return route.replace(/\/app_[^/]+/, `/app_${stripIdPrefix(id)}`)
}

export function useReplaceRouteWithAppId() {
  const location = useLocation()
  const pathname = location.pathname
  return useCallback((id: string) => replaceRouteWithAppId(pathname, id), [pathname])
}
