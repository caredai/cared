import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Profile } from './profile'

export default function Page() {
  prefetch(trpc.user.accounts.queryOptions())

  return (
    <HydrateClient>
      <Profile />
    </HydrateClient>
  )
}
