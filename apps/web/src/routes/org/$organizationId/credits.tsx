import { createFileRoute } from '@tanstack/react-router'

import { Credits } from '@/components/credits'
import { orpc } from '@/lib/orpc'
import { addIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/org/$organizationId/credits')({
  loader: ({ context, params }) => {
    const organizationId = addIdPrefix(params.organizationId, 'org')

    void context.queryClient.prefetchQuery(
      orpc.credits.getCredits.queryOptions({
        input: {
          organizationId,
        },
      }),
    )
  },
  component: CreditsPage,
})

function CreditsPage() {
  const { organizationId } = Route.useParams()
  const organizationIdWithPrefix = addIdPrefix(organizationId, 'org')

  return <Credits organizationId={organizationIdWithPrefix} />
}
