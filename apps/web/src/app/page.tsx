import { RedirectWorkspace } from '@/components/redirect-workspace'
import {fetch, HydrateClient, prefetch, trpc} from '@/trpc/server'
import Landing from './landing/page'

export default async function Page() {
  const session = await fetch(trpc.user.session.queryOptions())
  const userId = session?.user.id

  if (userId) {
    prefetch(trpc.user.me.queryOptions())
    prefetch(trpc.user.accounts.queryOptions())
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
