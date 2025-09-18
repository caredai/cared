
import { Apps } from './apps'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

/**
 * Apps page component
 * Renders the Apps component with client-side hydration
 */
export default function Page() {
  prefetch(orpc.app.list.queryOptions())
  prefetch(orpc.app.listCategories.queryOptions())
  prefetch(orpc.model.listProvidersModels.queryOptions())
  prefetch(orpc.model.listDefaultModels.queryOptions())

  return (
    <HydrateClient>
      <Apps />
    </HydrateClient>
  )
}
