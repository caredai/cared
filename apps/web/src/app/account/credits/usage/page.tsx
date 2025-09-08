import { Expenses } from '@/components/expenses'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

export default function Page() {
  prefetch(trpc.model.listProviders.queryOptions())
  prefetch(trpc.model.listModels.queryOptions({}))

  return (
    <HydrateClient>
      <Expenses />
    </HydrateClient>
  )
}
