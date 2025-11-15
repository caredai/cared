import { createFileRoute } from '@tanstack/react-router'

import { SectionTitle } from '@/components/section'
import { Toolkits } from '@/components/tools'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/tools')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <SectionTitle title="Tools" description="View and manage available toolkits" />
      <div className="h-[calc(100dvh-57px-48px-88px)]">
        <Toolkits />
      </div>
    </>
  )
}
