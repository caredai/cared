import { createFileRoute, redirect } from '@tanstack/react-router'

import { orpc } from '@/lib/orpc'
import { stripIdPrefix } from '@/lib/utils'
import { Landing } from './landing/-landing'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await orpc.user.session.call({
      auth: false,
    })

    if (session) {
      const accountId = session.session.activeAccountId ?? session.user.defaultAccountId
      if (!accountId) {
        throw redirect({ to: `/user/applications` })
      } else {
        throw redirect({
          to: `/acc_{$accountIdNoPrefix}`,
          params: { accountIdNoPrefix: stripIdPrefix(accountId) },
        })
      }
    }
  },
  component: Page,
})

function Page() {
  return <Landing />
}
