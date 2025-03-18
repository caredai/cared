import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Apps } from './apps'

/**
 * Apps page component
 * Renders the Apps component with client-side hydration
 */
export default async function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params

  prefetch(
    trpc.app.list.queryOptions({
      workspaceId,
      limit: 100,
    }),
  )
  prefetch(trpc.app.listCategories.queryOptions({ limit: 100 }))
  prefetch(trpc.model.listModels.queryOptions())

  return (
    <HydrateClient>
      <Apps />
    </HydrateClient>
  )
}
