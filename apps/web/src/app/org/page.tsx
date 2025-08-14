import { createCaller } from '@cared/api'

import { createContext, HydrateClient, prefetch, trpc } from '@/trpc/server'
import { Redirect } from './redirect'

export default async function Page() {
  prefetch(trpc.user.session.queryOptions())

  await createCaller(createContext).organization.setActive({
    organizationId: null,
  })

  return (
    <HydrateClient>
      <Redirect />
    </HydrateClient>
  )
}
