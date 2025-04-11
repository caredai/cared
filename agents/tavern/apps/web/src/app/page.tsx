import { Suspense } from 'react'

import { Content } from '@/app/content'
import { fetch, HydrateClient, prefetch, trpc } from '@/trpc/server'
import { SignIn } from './sign-in'

export default async function Page() {
  const session = await fetch(trpc.user.session.queryOptions())
  if (!session) {
    return <SignIn />
  }

  prefetch(trpc.settings.get.queryOptions())

  return (
    <HydrateClient>
      <Suspense fallback={<></>}>
        <Content />
      </Suspense>
    </HydrateClient>
  )
}
