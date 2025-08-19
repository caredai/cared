import { Suspense } from 'react'

import { SkeletonCard } from '@/components/skeleton'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { ApiKeys } from './api-keys'

export default async function ApiKeyPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId: appIdNoPrefix } = await params
  const appId = addIdPrefix(appIdNoPrefix, 'app')

  prefetch(trpc.apiKey.list.queryOptions())

  return (
    <HydrateClient>
      <Suspense fallback={<SkeletonCard />}>
        <ApiKeys appId={appId} />
      </Suspense>
    </HydrateClient>
  )
}
