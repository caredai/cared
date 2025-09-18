import { Suspense } from 'react'

import { SkeletonCard } from '@/components/skeleton'
import { addIdPrefix } from '@/lib/utils'
import { OAuthApp } from './oauth-app'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default async function Page({
  params,
}: {
  params: Promise<{
    appId: string
  }>
}) {
  const { appId: appIdNoPrefix } = await params
  const appId = addIdPrefix(appIdNoPrefix, 'app')

  prefetch(
    orpc.oauthApp.list.queryOptions({
      appId,
    }),
  )

  return (
    <HydrateClient>
      <Suspense fallback={<SkeletonCard />}>
        <OAuthApp appId={appId} />
      </Suspense>
    </HydrateClient>
  )
}
