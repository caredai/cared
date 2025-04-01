import { Suspense } from 'react'

import { SkeletonCard } from '@/components/skeleton'
import { addIdPrefix } from '@/lib/utils'
import { fetch, HydrateClient, prefetch, trpc } from '@/trpc/server'
import { ApiKey } from './api-key'

export default async function ApiKeyPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId: appIdNoPrefix } = await params
  const appId = addIdPrefix(appIdNoPrefix, 'app')
  const { exists } = await fetch(trpc.apiKey.has.queryOptions({ appId }))
  if (exists) {
    prefetch(trpc.apiKey.get.queryOptions({ appId }))
  }

  return (
    <HydrateClient>
      <Suspense fallback={<SkeletonCard />}>
        <ApiKey appId={appId} />
      </Suspense>
    </HydrateClient>
  )
}
