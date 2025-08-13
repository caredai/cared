import { Models } from '@/components/models'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

/**
 * Models page component
 * Renders the Models component with client-side hydration
 */
export default function Page() {
  prefetch(trpc.model.listProviders.queryOptions())
  prefetch(trpc.model.listModels.queryOptions())

  return (
    <HydrateClient>
      <Models />
    </HydrateClient>
  )
}
