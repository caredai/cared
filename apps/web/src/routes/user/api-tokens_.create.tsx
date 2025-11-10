import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { CreateApiToken } from '@/components/api-tokens/create-api-token'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/user/api-tokens_/create')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.apiToken.listPermissionGroups.queryOptions())
    void context.queryClient.prefetchQuery(
      orpc.apiToken.list.queryOptions({
        input: { scope: 'user' },
      }),
    )
  },
  component: CreateApiTokenPage,
})

function CreateApiTokenPage() {
  return (
    <>
      <SectionTitle
        title="Create User API Token"
        description="Create a new user API token with restricted permissions"
      />

      <Suspense fallback={<SkeletonCard />}>
        <CreateApiToken scope="user" />
      </Suspense>
    </>
  )
}
