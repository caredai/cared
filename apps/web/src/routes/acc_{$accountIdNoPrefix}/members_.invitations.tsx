import { createFileRoute } from '@tanstack/react-router'

import { orpc } from '@/lib/orpc'
import { Members } from './-members'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/members_/invitations')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.account.account.listMembers.queryOptions())
    void context.queryClient.prefetchQuery(orpc.account.account.listInvitations.queryOptions())
  },
  component: () => <Members kind="invitations" />,
})
