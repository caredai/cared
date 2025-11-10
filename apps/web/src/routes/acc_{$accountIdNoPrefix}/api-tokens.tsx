import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ApiTokens } from '@/components/api-tokens'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/api-tokens')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.apiToken.listPermissionGroups.queryOptions())
    void context.queryClient.prefetchQuery(
      orpc.apiToken.list.queryOptions({
        input: { scope: 'account' },
      }),
    )
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
        <ApiTokens scope="account" />
      </Suspense>
    </>
  )
}
