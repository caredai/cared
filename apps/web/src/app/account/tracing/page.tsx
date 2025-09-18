import { Tracing } from '@/components/tracing'

import { HydrateClient } from '@/orpc/client'

export default function AccountTracingPage() {
  return (
    <HydrateClient>
      <Tracing scope="user" />
    </HydrateClient>
  )
}
