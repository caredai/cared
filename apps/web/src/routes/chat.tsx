import { createFileRoute, redirect } from '@tanstack/react-router'

import { getWebUrl } from '@cared/auth/client'

export const Route = createFileRoute('/chat')({
  loader: () => {
    throw redirect({
      href: getWebUrl() + '/chat',
    })
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div></div>
}
