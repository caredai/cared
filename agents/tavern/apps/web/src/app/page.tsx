import { Suspense } from 'react'

import { fetch, HydrateClient, prefetch, trpc } from '@/trpc/server'
import { PageContent } from './_page'
import { SignIn } from './sign-in'

export default async function Page() {
  const session = await fetch(trpc.user.session.queryOptions())
  if (!session) {
    return <SignIn />
  }

  prefetch(trpc.settings.get.queryOptions())
  prefetch(trpc.character.list.queryOptions())

  return (
    <HydrateClient>
      <Suspense fallback={<></>}>
        <PageContent />
      </Suspense>
    </HydrateClient>
  )
}
