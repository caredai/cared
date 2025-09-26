import { createFileRoute } from '@tanstack/react-router'

import { Models } from '@/components/models'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/account/models')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.model.listProviders.queryOptions())
    void context.queryClient.prefetchQuery(orpc.model.listModels.queryOptions())
    void context.queryClient.prefetchQuery(orpc.providerKey.list.queryOptions())
  },
  component: () => <Models />,
})
