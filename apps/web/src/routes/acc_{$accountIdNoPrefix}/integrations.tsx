import { createFileRoute } from '@tanstack/react-router'

import { Integrations } from '@/components/integrations'
import { orpc } from '@/lib/orpc'

// Route path; type assertion needed until route tree is regenerated (e.g. pnpm dev)
export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/integrations')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(
      orpc.account.integration.list.queryOptions({ input: {} }),
    )
  },
  component: () => <Integrations />,
})
