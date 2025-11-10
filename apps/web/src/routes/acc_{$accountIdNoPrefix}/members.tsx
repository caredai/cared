import { createFileRoute } from '@tanstack/react-router'

import { getActiveAccountId } from '@/lib/active'
import { orpc } from '@/lib/orpc'
import { Members } from './-members'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/members')({
  loader: async ({ context, params }) => {
    const { activeAccountId } = await getActiveAccountId(params)

    void context.queryClient.prefetchQuery(
      orpc.account.listMembers.queryOptions({
        input: {
          accountId: activeAccountId,
        },
      }),
    )

    void context.queryClient.prefetchQuery(
      orpc.account.listInvitations.queryOptions({
        input: {
          accountId: activeAccountId,
        },
      }),
    )
  },
  component: () => <Members kind="members" />,
})
