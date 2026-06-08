import { createFileRoute } from '@tanstack/react-router'

import { TracingWithSelector } from '@/components/tracing'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/tracing')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.account.account.listMembers.queryOptions())
  },
  component: TracingPage,
})

function TracingPage() {
  return <TracingWithSelector />
}
