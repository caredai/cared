import { getActiveOrganizationId } from '@/lib/active'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Workspaces } from './workspaces'

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { activeOrganizationId } = await getActiveOrganizationId(params)

  prefetch(
    trpc.app.list.queryOptions({
      organizationId: activeOrganizationId,
    }),
  )

  return (
    <HydrateClient>
      <Workspaces />
    </HydrateClient>
  )
}
