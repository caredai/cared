import { createFileRoute } from '@tanstack/react-router'

import { TracingWithSelector } from '@/components/tracing'
import { addIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/org/$organizationId/tracing')({
  component: TracingPage,
})

function TracingPage() {
  const { organizationId } = Route.useParams()
  const organizationIdWithPrefix = addIdPrefix(organizationId, 'org')

  return <TracingWithSelector scope="organization" organizationId={organizationIdWithPrefix} />
}
