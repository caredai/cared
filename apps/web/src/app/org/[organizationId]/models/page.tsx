import { Models } from '@/components/models'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

/**
 * Models page component
 * Renders the Models component with client-side hydration
 */
export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId: orgIdNoPrefix } = await params
  const organizationId = addIdPrefix(orgIdNoPrefix, 'org')

  prefetch(trpc.model.listProviders.queryOptions())
  prefetch(trpc.model.listModels.queryOptions({
    organizationId
  }))
  prefetch(
    trpc.providerKey.list.queryOptions({
      organizationId,
    }),
  )

  return (
    <HydrateClient>
      <Models organizationId={organizationId} />
    </HydrateClient>
  )
}
