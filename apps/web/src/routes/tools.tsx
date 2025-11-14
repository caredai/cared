import { createFileRoute } from '@tanstack/react-router'

import { Toolkits } from '@/components/tools'
import { SiteHeader } from '@/routes/landing/-site-header'

export const Route = createFileRoute('/tools')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <SiteHeader />
      <Toolkits />
    </>
  )
}
