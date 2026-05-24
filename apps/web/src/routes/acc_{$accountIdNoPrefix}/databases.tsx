import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Namespaces } from '@/components/databases'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/databases')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.account.database.listNamespaces.queryOptions())
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { accountIdNoPrefix } = Route.useParams()
  return (
    <Suspense fallback={<SkeletonCard />}>
      <Namespaces accountIdNoPrefix={accountIdNoPrefix} />
    </Suspense>
  )
}
