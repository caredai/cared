import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Credits } from './credits'

export default function Page() {
  prefetch(trpc.credits.getCredits.queryOptions())

  return (
    <HydrateClient>
      <Credits />
    </HydrateClient>
  )
}
