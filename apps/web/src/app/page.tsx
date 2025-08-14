import { redirect } from 'next/navigation'

import { createCaller } from '@cared/api'

import { stripIdPrefix } from '@/lib/utils'
import { createContext } from '@/trpc/server'
import Landing from './landing/page'

export default async function Page() {
  const session = await createCaller(createContext).user.session({
    auth: false,
  })
  const userId = session?.user.id

  if (userId) {
    const orgId = session.session.activeOrganizationId
    if (!orgId) {
      redirect(`/account/credits`)
    } else {
      redirect(`/org/${stripIdPrefix(orgId)}`)
    }
  }

  return <Landing />
}
