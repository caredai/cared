import { createFileRoute } from '@tanstack/react-router'

import { TracingWithSelector } from '@/components/tracing'
import { addIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/workspace/$workspaceId/tracing')({
  component: TracingPage,
})

function TracingPage() {
  const { workspaceId: workspaceIdNoPrefix } = Route.useParams()
  const workspaceId = addIdPrefix(workspaceIdNoPrefix, 'workspace')

  return <TracingWithSelector scope="workspace" workspaceId={workspaceId} />
}
