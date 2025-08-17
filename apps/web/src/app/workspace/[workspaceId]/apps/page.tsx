import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Apps } from './apps'

/**
 * Apps page component
 * Renders the Apps component with client-side hydration
 */
export default function Page() {
  prefetch(trpc.app.list.queryOptions())
  prefetch(trpc.app.listCategories.queryOptions())
  prefetch(trpc.model.listProvidersModels.queryOptions())
  prefetch(trpc.model.listDefaultModels.queryOptions())

  return (
    <HydrateClient>
      <Apps />
    </HydrateClient>
  )
}
