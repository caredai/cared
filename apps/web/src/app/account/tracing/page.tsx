import { Tracing } from '@/components/tracing'
import { HydrateClient } from '@/trpc/server'

export default function AccountTracingPage() {
  return (
    <HydrateClient>
      <Tracing scope="user" />
    </HydrateClient>
  )
}
