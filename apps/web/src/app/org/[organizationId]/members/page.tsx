import { getActiveOrganizationId } from '@/lib/active'
import { Members } from './members'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  return <HydrateMembers kind="members" params={params} />
}

export async function HydrateMembers({
  kind,
  params,
}: {
  kind: 'members' | 'invitations'
  params: Promise<{ organizationId: string }>
}) {
  const { activeOrganizationId } = await getActiveOrganizationId(params)

  prefetch(
    orpc.organization.listMembers.queryOptions({
      organizationId: activeOrganizationId,
    }),
  )
  prefetch(
    orpc.organization.listInvitations.queryOptions({
      organizationId: activeOrganizationId,
    }),
  )

  return (
    <HydrateClient>
      <Members kind={kind} />
    </HydrateClient>
  )
}
