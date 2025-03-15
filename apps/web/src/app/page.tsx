import { auth } from '@clerk/nextjs/server'

import { RedirectWorkspace } from '@/components/redirect-workspace'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import Landing from './landing/page'

export default async function Page() {
  const { userId } = await auth()
  if (userId) {
    await Promise.all([
      prefetch(trpc.user.me.queryOptions()),
      prefetch(trpc.workspace.list.queryOptions()),
    ])
  }

  return (
    <>
      <Landing />
      {userId && (
        <HydrateClient>
          <RedirectWorkspace />
        </HydrateClient>
      )}
    </>
  )
}
