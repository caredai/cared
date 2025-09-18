
import { Categories } from './categories'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default function Page() {
  prefetch(
    orpc.app.listCategories.queryOptions({
      limit: 100,
    }),
  )

  return (
    <HydrateClient>
      <Categories />
    </HydrateClient>
  )
}
