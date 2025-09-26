import { createFileRoute, redirect } from '@tanstack/react-router'

import { orpcClient } from '@/lib/orpc'
import { stripIdPrefix } from '@/lib/utils'
import { Landing } from './landing'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await orpcClient.user.session({
      auth: false,
    })
    const userId = session?.user.id

    if (userId) {
      const orgId = session.session.activeOrganizationId
      if (!orgId) {
        throw redirect({ to: `/account/credits` })
      } else {
        throw redirect({
          to: `/org/$organizationId`,
          params: { organizationId: stripIdPrefix(orgId) },
        })
      }
    }
  },
  component: Page,
})

function Page() {
  return <Landing />
}
