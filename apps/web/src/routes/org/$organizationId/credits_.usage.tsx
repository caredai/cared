import { createFileRoute } from '@tanstack/react-router'

import { Expenses } from '@/components/expenses'
import { orpc } from '@/lib/orpc'
import { addIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/org/$organizationId/credits_/usage')({
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
  },
  component: Usage,
})

function Usage() {
  const { organizationId } = Route.useParams()
  const organizationIdWithPrefix = addIdPrefix(organizationId, 'org')

  return <Expenses organizationId={organizationIdWithPrefix} />
}
