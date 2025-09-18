import { Models } from '@/components/models'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

/**
 * Models page component
 * Renders the Models component with client-side hydration
 */
export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId: orgIdNoPrefix } = await params
  const organizationId = addIdPrefix(orgIdNoPrefix, 'org')

  prefetch(orpc.model.listProviders.queryOptions())
  prefetch(orpc.model.listModels.queryOptions({
    organizationId
  }))
  prefetch(
    orpc.providerKey.list.queryOptions({
      organizationId,
    }),
  )

  return (
    <HydrateClient>
      <Models organizationId={organizationId} />
    </HydrateClient>
  )
}
