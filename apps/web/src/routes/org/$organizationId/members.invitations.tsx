import { createFileRoute } from '@tanstack/react-router'

import { getActiveOrganizationId } from '@/lib/active'
import { orpc } from '@/lib/orpc'
import { Members } from './members'

export const Route = createFileRoute('/org/$organizationId/members/invitations')({
  loader: async ({ context, params }) => {
    const { activeOrganizationId } = await getActiveOrganizationId(params)

    void context.queryClient.prefetchQuery(
      orpc.organization.listMembers.queryOptions({
        input: {
          organizationId: activeOrganizationId,
        },
      }),
    )
    void context.queryClient.prefetchQuery(
      orpc.organization.listInvitations.queryOptions({
        input: {
          organizationId: activeOrganizationId,
        },
      }),
    )
  },
  component: () => <Members kind="invitations" />,
})
