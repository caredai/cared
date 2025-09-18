import { Suspense } from 'react'

import { ApiKeysWithSelector } from '@/components/api-keys'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default async function WorkspaceApiKeyPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId: workspaceIdNoPrefix } = await params
  const workspaceId = addIdPrefix(workspaceIdNoPrefix, 'workspace')

  prefetch(orpc.apiKey.list.queryOptions())

  return (
    <HydrateClient>
      <SectionTitle
        title="API Keys"
        description="Configure API keys to securely control access to your workspace"
      />

      <Suspense fallback={<SkeletonCard />}>
        <ApiKeysWithSelector scope="workspace" workspaceId={workspaceId} />
      </Suspense>
    </HydrateClient>
  )
}
