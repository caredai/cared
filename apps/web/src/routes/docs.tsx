import { createFileRoute, redirect } from '@tanstack/react-router'

import { getWebUrl } from '@cared/auth/client'

export const Route = createFileRoute('/docs')({
  loader: () => {
    throw redirect({
      href: getWebUrl() + '/docs',
    })
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs"!</div>
}
