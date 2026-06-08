import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { CreateOAuthApp } from '@/components/oauth-apps/create-oauth-app'
import { SectionTitle } from '@/components/section'
import { SkeletonCard } from '@/components/skeleton'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/oauth-apps_/create')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.account.oauthApp.listScopes.queryOptions())
  },
  component: CreateOAuthAppPage,
})

function CreateOAuthAppPage() {
  const { accountIdNoPrefix } = Route.useParams()

  return (
    <>
      <SectionTitle
        title="Create OAuth App"
        description="Register a new OAuth App with selected permission scopes"
      />

      <Suspense fallback={<SkeletonCard />}>
        <CreateOAuthApp accountIdNoPrefix={accountIdNoPrefix} />
      </Suspense>
    </>
  )
}
