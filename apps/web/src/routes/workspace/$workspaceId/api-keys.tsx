import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ApiKeysWithSelector } from '@/components/api-keys'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'
import { addIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/workspace/$workspaceId/api-keys')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.apiKey.list.queryOptions())
  },
  component: ApiKeysPage,
})

function ApiKeysPage() {
  const { workspaceId: workspaceIdNoPrefix } = Route.useParams()
  const workspaceId = addIdPrefix(workspaceIdNoPrefix, 'workspace')

  return (
    <>
      <SectionTitle
        title="API Keys"
        description="Configure API keys to securely control access to your workspace"
      />

      <Suspense fallback={<SkeletonCard />}>
        <ApiKeysWithSelector scope="workspace" workspaceId={workspaceId} />
      </Suspense>
    </>
  )
}
