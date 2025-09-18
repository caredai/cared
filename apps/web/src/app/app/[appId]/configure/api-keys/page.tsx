import { Suspense } from 'react'

import { ApiKeys } from '@/components/api-keys'
import { SkeletonCard } from '@/components/skeleton'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default async function ApiKeyPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId: appIdNoPrefix } = await params
  const appId = addIdPrefix(appIdNoPrefix, 'app')

  prefetch(orpc.apiKey.list.queryOptions())

  return (
    <HydrateClient>
      <Suspense fallback={<SkeletonCard />}>
        <ApiKeys scope="app" appId={appId} showTitle />
      </Suspense>
    </HydrateClient>
  )
}
