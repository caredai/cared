import { getActiveOrganizationId } from '@/lib/active'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Members } from './members'

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { activeOrganizationId } = await getActiveOrganizationId(params)

  prefetch(
    trpc.organization.listMembers.queryOptions({
      organizationId: activeOrganizationId,
    }),
  )
  prefetch(
    trpc.organization.listInvitations.queryOptions({
      organizationId: activeOrganizationId,
    }),
  )

  return (
    <HydrateClient>
      <Members />
    </HydrateClient>
  )
}
