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
  prefetch(trpc.persona.list.queryOptions())
  prefetch(trpc.character.list.queryOptions())
  prefetch(trpc.characterGroup.list.queryOptions())
  prefetch(trpc.modelPreset.list.queryOptions())
  prefetch(trpc.model.list.queryOptions())
  prefetch(
    trpc.lorebook.list.queryOptions({
      includeEntries: true,
    }),
  )

  return (
    <HydrateClient>
      <Suspense fallback={<></>}>
        <PageContent />
      </Suspense>
    </HydrateClient>
  )
}
