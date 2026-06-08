import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ApiTokens } from '@/components/api-tokens'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/api-tokens')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(
      orpc.account.apiToken.listPermissionGroups.queryOptions(),
    )
    void context.queryClient.prefetchQuery(
      orpc.account.apiToken.list.queryOptions({
        input: { credentialType: 'account' },
      }),
    )
    void context.queryClient.prefetchQuery(orpc.account.account.listMembers.queryOptions())
  },
  component: ApiKeysPage,
})

function ApiKeysPage() {
  return (
    <>
      <SectionTitle
        title="Account API Tokens"
        description="Configure Account API tokens to securely control access to your models and apps"
      />

      <Suspense fallback={<SkeletonCard />}>
        <ApiTokens credentialType="account" />
      </Suspense>
    </>
  )
}
