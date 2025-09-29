import { createFileRoute } from '@tanstack/react-router'

import { orpcClient } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { Redirect } from './-redirect'

export const Route = createFileRoute('/org/')({
  beforeLoad: async ({ context }) => {
    await prefetchAndCheckSession(context.queryClient)

    await orpcClient.organization.setActive({
      organizationId: null,
    })
  },
  component: () => <Redirect />,
})
