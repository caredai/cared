
import { Security } from './security'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default function Page() {
  prefetch(orpc.user.sessions.queryOptions())
  prefetch(orpc.user.accounts.queryOptions())

  return (
    <HydrateClient>
      <Security />
    </HydrateClient>
  )
}
