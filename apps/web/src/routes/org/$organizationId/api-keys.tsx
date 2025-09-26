import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ApiKeysWithSelector } from '@/components/api-keys'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'
import { addIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/org/$organizationId/api-keys')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.apiKey.list.queryOptions())
  },
  component: ApiKeysPage,
})

function ApiKeysPage() {
  const { organizationId } = Route.useParams()
  const organizationIdWithPrefix = addIdPrefix(organizationId, 'org')

  return (
    <>
      <SectionTitle
        title="API Keys"
        description="Configure API keys to securely control access to your organization"
      />

      <Suspense fallback={<SkeletonCard />}>
        <ApiKeysWithSelector scope="organization" organizationId={organizationIdWithPrefix} />
      </Suspense>
    </>
  )
}
