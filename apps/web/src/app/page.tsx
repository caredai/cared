import { headers } from 'next/headers'

import { auth } from '@mindworld/auth'

import { RedirectWorkspace } from '@/components/redirect-workspace'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import Landing from './landing/page'

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const userId = session?.user.id

  if (userId) {
    prefetch(trpc.user.me.queryOptions())
    prefetch(trpc.workspace.list.queryOptions())
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
