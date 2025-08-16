import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Security } from './security'

export default function Page() {
  prefetch(trpc.user.session.queryOptions())
  prefetch(trpc.user.sessions.queryOptions())
  prefetch(trpc.user.accounts.queryOptions())

  return (
    <HydrateClient>
      <Security />
    </HydrateClient>
  )
}
