import { Suspense } from 'react'

import { ApiKeysWithSelector } from '@/components/api-keys'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

export default async function OrganizationApiKeyPage({
  params,
}: {
  params: Promise<{ organizationId: string }>
}) {
  const { organizationId: organizationIdNoPrefix } = await params
  const organizationId = addIdPrefix(organizationIdNoPrefix, 'org')

  prefetch(trpc.apiKey.list.queryOptions())

  return (
    <HydrateClient>
      <SectionTitle
        title="API Keys"
        description="Configure API keys to securely control access to your organization"
      />

      <Suspense fallback={<SkeletonCard />}>
        <ApiKeysWithSelector scope="organization" organizationId={organizationId} />
      </Suspense>
    </HydrateClient>
  )
}
