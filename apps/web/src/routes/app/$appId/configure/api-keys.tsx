import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ApiKeys } from '@/components/api-keys'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'
import { addIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/app/$appId/configure/api-keys')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.apiKey.list.queryOptions())
  },
  component: ApiKeysPage,
})

function ApiKeysPage() {
  const { appIdNoPrefix } = Route.useRouteContext()
  const appId = addIdPrefix(appIdNoPrefix, 'app')

  return (
    <Suspense fallback={<SkeletonCard />}>
      <ApiKeys scope="app" appId={appId} showTitle />
    </Suspense>
  )
}
