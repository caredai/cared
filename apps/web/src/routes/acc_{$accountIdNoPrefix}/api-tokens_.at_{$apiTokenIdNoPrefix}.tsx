import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ApiTokenDetail } from '@/components/api-tokens/api-token-detail'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'
import { addIdPrefix } from '@/lib/utils'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/api-tokens_/at_{$apiTokenIdNoPrefix}')({
  loader: ({ context, params }) => {
    const apiTokenId = addIdPrefix(params.apiTokenIdNoPrefix, 'at')
    void context.queryClient.prefetchQuery(
      orpc.account.apiToken.get.queryOptions({
        input: { id: apiTokenId },
      }),
    )
    void context.queryClient.prefetchQuery(
      orpc.account.apiToken.listPermissionGroups.queryOptions(),
    )
    void context.queryClient.prefetchQuery(orpc.account.account.listMembers.queryOptions())
  },
  component: AccountApiTokenDetailPage,
})

function AccountApiTokenDetailPage() {
  const { accountIdNoPrefix, apiTokenIdNoPrefix } = Route.useParams()
  const apiTokenId = addIdPrefix(apiTokenIdNoPrefix, 'at')

  return (
    <Suspense fallback={<SkeletonCard />}>
      <ApiTokenDetail
        apiTokenId={apiTokenId}
        credentialType="account"
        accountIdNoPrefix={accountIdNoPrefix}
      />
    </Suspense>
  )
}
