import { createFileRoute } from '@tanstack/react-router'

import { FunctionsPage } from '@/components/functions'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/functions')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.account.function.listCaredFunctions.queryOptions())
    void context.queryClient.prefetchQuery(orpc.account.function.listRegions.queryOptions())
  },
  component: FunctionsPage,
})
