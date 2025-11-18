import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Mcps } from '@/components/mcp'
import { SkeletonCard } from '@/components/skeleton'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/mcp')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="container mx-auto p-6 h-full">
      <Suspense fallback={<SkeletonCard />}>
        <Mcps />
      </Suspense>
    </div>
  )
}
