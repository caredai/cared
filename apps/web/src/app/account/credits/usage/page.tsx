import { Expenses } from '@/components/expenses'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

export default function Page() {
  prefetch(orpc.model.listProviders.queryOptions())
  prefetch(orpc.model.listModels.queryOptions())

  return (
    <HydrateClient>
      <Expenses />
    </HydrateClient>
  )
}
