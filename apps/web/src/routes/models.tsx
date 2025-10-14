import { createFileRoute } from '@tanstack/react-router'

import { SiteHeader } from '@/routes/landing/-site-header'

export const Route = createFileRoute('/models')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <SiteHeader />
      <div>Hello "/models"!</div>
    </>
  )
}
