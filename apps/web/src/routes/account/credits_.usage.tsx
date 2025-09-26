import { createFileRoute } from '@tanstack/react-router'

import { Expenses } from '@/components/expenses'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/account/credits_/usage')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.model.listProviders.queryOptions())
    void context.queryClient.prefetchQuery(orpc.model.listModels.queryOptions())
  },
  component: () => <Expenses />,
})
