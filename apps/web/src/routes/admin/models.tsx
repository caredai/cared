import { createFileRoute } from '@tanstack/react-router'

import { Models } from '@/components/models'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/admin/models')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.model.listProviders.queryOptions())
    void context.queryClient.prefetchQuery(
      orpc.model.listModels.queryOptions({
        input: {
          source: 'system',
        },
      }),
    )
    void context.queryClient.prefetchQuery(
      orpc.providerKey.list.queryOptions({
        input: {
          isSystem: true,
        },
      }),
    )
  },
  component: () => {
    return <Models isSystem />
  },
})
