import { createFileRoute } from '@tanstack/react-router'

import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/sandboxes')({
  beforeLoad: async () => {
    await orpc.account.sandbox.enable.call()

    throw Route.redirect({ to: './sandboxes' })
  },
  component: RouteComponent,
})

function RouteComponent() {
  return null
}
