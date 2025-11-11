import { createFileRoute } from '@tanstack/react-router'

import { Models } from '@/components/models'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/models')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.account.model.listProviders.queryOptions())
    void context.queryClient.prefetchQuery(
      orpc.account.model.listModels.queryOptions({
        input: {
          source: 'effective',
        },
      }),
    )
    void context.queryClient.prefetchQuery(
      orpc.account.providerKey.list.queryOptions({
        input: {
          source: 'custom',
        },
      }),
    )
  },
  component: ModelsPage,
})

function ModelsPage() {
  return <Models scope="effective" />
}
