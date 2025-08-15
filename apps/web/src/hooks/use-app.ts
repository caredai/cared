import { useMemo } from 'react'
import { skipToken, useSuspenseQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

export function useApps({
  organizationId,
  workspaceId,
}: {
  organizationId?: string
  workspaceId?: string
}) {
  const trpc = useTRPC()

  const {
    data: { apps },
  } = useSuspenseQuery(
    trpc.app.list.queryOptions(
      organizationId || workspaceId
        ? {
            organizationId,
            workspaceId,
          }
        : skipToken,
    ),
  )

  return {
    apps,
  }
}

export function useAppsByCategories({
  workspaceId,
  categories,
}: {
  workspaceId: string
  categories: Set<string>
}) {
  const { apps } = useApps({ workspaceId })

  const appsByCategories = useMemo(
    () => apps.filter((app) => app.categories.some((c) => categories.has(c.id))),
    [apps, categories],
  )

  return {
    appsByCategories,
  }
}

export function useAppsByTags({ workspaceId, tags }: { workspaceId: string; tags: Set<string> }) {
  const { apps } = useApps({ workspaceId })

  const appsByTags = useMemo(
    () => apps.filter((app) => app.tags.some((t) => tags.has(t))),
    [apps, tags],
  )

  return {
    appsByTags,
  }
}
