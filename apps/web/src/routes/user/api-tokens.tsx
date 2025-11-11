import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ApiTokens } from '@/components/api-tokens'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/user/api-tokens')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.account.apiToken.listPermissionGroups.queryOptions())
    void context.queryClient.prefetchQuery(
      orpc.account.apiToken.list.queryOptions({
        input: { scope: 'user' },
      }),
    )
  },
  component: ApiKeysPage,
})

function ApiKeysPage() {
  return (
    <>
      <SectionTitle
        title="User API Tokens"
        description="Configure User API tokens to securely control access to your accounts, models and apps"
      />

      <Suspense fallback={<SkeletonCard />}>
        <ApiTokens scope="user" />
      </Suspense>
    </>
  )
}
