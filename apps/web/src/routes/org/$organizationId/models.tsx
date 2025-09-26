import { createFileRoute } from '@tanstack/react-router'

import { Models } from '@/components/models'
import { orpc } from '@/lib/orpc'
import { addIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/org/$organizationId/models')({
  loader: ({ context, params }) => {
    const organizationId = addIdPrefix(params.organizationId, 'org')

    void context.queryClient.prefetchQuery(orpc.model.listProviders.queryOptions())
    void context.queryClient.prefetchQuery(
      orpc.model.listModels.queryOptions({
        input: {
          organizationId,
        },
      }),
    )
    void context.queryClient.prefetchQuery(
      orpc.providerKey.list.queryOptions({
        input: {
          organizationId,
        },
      }),
    )
  },
  component: ModelsPage,
})

function ModelsPage() {
  const { organizationId } = Route.useParams()
  const organizationIdWithPrefix = addIdPrefix(organizationId, 'org')

  return <Models organizationId={organizationIdWithPrefix} />
}
