import { createCaller } from '@cared/api'

import { prefetchAndCheckSession } from '@/lib/session'
import { createContext, HydrateClient } from '@/trpc/server'
import { Redirect } from './redirect'

export default async function Page() {
  if (!(await prefetchAndCheckSession())) {
    return
  }

  await createCaller(createContext).organization.setActive({
    organizationId: null,
  })

  return (
    <HydrateClient>
      <Redirect />
    </HydrateClient>
  )
}
