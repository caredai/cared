import { createFileRoute } from '@tanstack/react-router'

import { orpcClient } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { Redirect } from './-redirect'

export const Route = createFileRoute('/org/')({
  beforeLoad: async () => {
    await prefetchAndCheckSession()

    await orpcClient.organization.setActive({
      organizationId: null,
    })
  },
  component: () => <Redirect />,
})
