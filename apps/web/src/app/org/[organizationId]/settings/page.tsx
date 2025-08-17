import { getActiveOrganizationId } from '@/lib/active'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Settings } from './settings'

export default function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  return <HydrateSettings params={params} />
}

export async function HydrateSettings({
  params,
}: {
  params: Promise<{ organizationId: string }>
}) {
  const { activeOrganizationId } = await getActiveOrganizationId(params)

  prefetch(
    trpc.organization.listMembers.queryOptions({
      organizationId: activeOrganizationId,
    }),
  )

  return (
    <HydrateClient>
      <Settings />
    </HydrateClient>
  )
}
