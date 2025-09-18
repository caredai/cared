
import { Tags } from './tags'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default function Page() {
  prefetch(
    orpc.app.listTags.queryOptions({
      limit: 100,
    }),
  )

  return (
    <HydrateClient>
      <Tags />
    </HydrateClient>
  )
}
