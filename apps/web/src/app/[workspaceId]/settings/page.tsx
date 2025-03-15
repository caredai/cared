import { QueryWorkspacesHydration } from '@/components/query-workspaces-hydration'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Settings } from './settings'

/**
 * Settings page for workspace management
 * Contains tabs for General settings and Members management
 */
export default async function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params

  await Promise.all([
    prefetch(trpc.workspace.list.queryOptions()),
    prefetch(
      trpc.workspace.get.queryOptions({
        id: workspaceId,
      }),
    ),
  ])

  return (
    <>
      <QueryWorkspacesHydration />
      <HydrateClient>
        <Settings />
      </HydrateClient>
    </>
  )
}
