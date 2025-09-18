import { prefetchAndCheckSession } from '@/lib/session'
import { HydrateClient, orpcClient } from '@/orpc/client'
import { Redirect } from './redirect'

export default async function Page() {
  if (!(await prefetchAndCheckSession())) {
    return
  }

  await orpcClient.organization.setActive({
    organizationId: null,
  })

  return (
    <HydrateClient>
      <Redirect />
    </HydrateClient>
  )
}
