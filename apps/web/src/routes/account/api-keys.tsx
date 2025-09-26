import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ApiKeys } from '@/components/api-keys'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/account/api-keys')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.apiKey.list.queryOptions())
  },
  component: () => (
    <>
      <SectionTitle
        title="API Keys"
        description="Configure API keys to securely control access to your account"
      />

      <Suspense fallback={<SkeletonCard />}>
        <ApiKeys scope="user" />
      </Suspense>
    </>
  ),
})
