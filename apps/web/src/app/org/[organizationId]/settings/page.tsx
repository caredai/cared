import { getActiveOrganizationId } from '@/lib/active'
import { Settings } from './settings'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

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
    orpc.organization.listMembers.queryOptions({
      organizationId: activeOrganizationId,
    }),
  )

  return (
    <HydrateClient>
      <Settings />
    </HydrateClient>
  )
}
