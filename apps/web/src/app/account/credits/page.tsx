
import { Credits } from '@/components/credits'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default function Page() {
  prefetch(orpc.credits.getCredits.queryOptions())

  return (
    <HydrateClient>
      <Credits />
    </HydrateClient>
  )
}
