import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Tags } from './tags'

export default function Page() {
  prefetch(
    trpc.app.listTags.queryOptions({
      limit: 100,
    }),
  )

  return (
    <HydrateClient>
      <Tags />
    </HydrateClient>
  )
}
