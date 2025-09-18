
import { Profile } from './profile'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default function Page() {
  prefetch(orpc.user.accounts.queryOptions())

  return (
    <HydrateClient>
      <Profile />
    </HydrateClient>
  )
}
