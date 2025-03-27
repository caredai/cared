import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Apps } from './apps'

/**
 * Apps page component
 * Renders the Apps component with client-side hydration
 */
export default async function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId: workspaceIdNoPrefix } = await params
  const workspaceId = addIdPrefix(workspaceIdNoPrefix, 'workspace')

  prefetch(
    trpc.app.list.queryOptions({
      workspaceId,
      limit: 100,
    }),
  )
  prefetch(trpc.app.listCategories.queryOptions({ limit: 100 }))
  prefetch(trpc.model.listProvidersModels.queryOptions())
  prefetch(trpc.model.listDefaultModels.queryOptions())

  return (
    <HydrateClient>
      <Apps />
    </HydrateClient>
  )
}
