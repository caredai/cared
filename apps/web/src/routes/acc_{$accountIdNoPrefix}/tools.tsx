import { createFileRoute } from '@tanstack/react-router'

import { Toolkits } from '@/components/tools'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/tools')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Toolkits />
    </>
  )
}
