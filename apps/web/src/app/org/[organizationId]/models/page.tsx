import { Models } from '@/components/models'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

/**
 * Models page component
 * Renders the Models component with client-side hydration
 */
export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const organizationId = (await params).organizationId

  prefetch(trpc.model.listProviders.queryOptions())
  prefetch(trpc.model.listModels.queryOptions())
  prefetch(
    trpc.providerKey.list.queryOptions({
      organizationId,
    }),
  )

  return (
    <HydrateClient>
      <Models />
    </HydrateClient>
  )
}
