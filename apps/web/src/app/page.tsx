import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createCaller } from '@cared/api'
import { db } from '@cared/db/client'

import { siteConfig } from '@/config/site'
import { stripIdPrefix } from '@/lib/utils'
import Landing from './landing/page'

export default async function Page() {
  const session = await createCaller({
    auth: {},
    db,
  }).user.session()
  const userId = session?.user.id

  if (userId) {
    const caller = createCaller({
      auth: {
        userId,
      },
      db,
    })
    const { workspaces } = await caller.workspace.list()

    const cookieName = `${siteConfig.name}.lastWorkspace`
    let lastWorkspace = (await cookies()).get(cookieName)?.value
    if (!lastWorkspace || !workspaces.some((w) => w.workspace.id === lastWorkspace)) {
      lastWorkspace = workspaces[0]?.workspace.id
    }

    if (lastWorkspace) {
      redirect(`/workspace/${stripIdPrefix(lastWorkspace)}/apps`)
    }
  }

  return <Landing />
}
