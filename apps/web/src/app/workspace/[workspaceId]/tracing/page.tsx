import { TracingWithSelector } from '@/components/tracing'
import { addIdPrefix } from '@/lib/utils'

import { HydrateClient } from '@/orpc/client'

export default async function WorkspaceTracingPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId: workspaceIdNoPrefix } = await params
  const workspaceId = addIdPrefix(workspaceIdNoPrefix, 'workspace')

  return (
    <HydrateClient>
      <TracingWithSelector scope="workspace" workspaceId={workspaceId} />
    </HydrateClient>
  )
}
