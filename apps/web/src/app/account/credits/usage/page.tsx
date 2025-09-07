import { Expenses } from '@/components/expenses'
import { HydrateClient } from '@/trpc/server'

export default function Page() {
  return (
    <HydrateClient>
      <Expenses />
    </HydrateClient>
  )
}
