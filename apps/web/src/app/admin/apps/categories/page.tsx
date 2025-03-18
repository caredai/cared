import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Categories } from './categories'

export default function Page() {
  prefetch(
    trpc.app.listCategories.queryOptions({
      limit: 100,
    }),
  )

  return (
    <HydrateClient>
      <Categories />
    </HydrateClient>
  )
}
