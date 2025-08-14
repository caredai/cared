import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createCaller } from '@cared/api'

import { AppTopBar } from '@/components/app-topbar'
import { RememberOrganization } from '@/components/remember-organization'
import { lastWorkspaceCookieName } from '@/lib/cookie'
import { addIdPrefix, stripIdPrefix } from '@/lib/utils'
import { createContext, fetch, HydrateClient, prefetch, trpc } from '@/trpc/server'

export default async function OrganizationLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ organizationId: string }>
}>) {
  const { organizationId: orgIdNoPrefix } = await params
  const organizationId = addIdPrefix(orgIdNoPrefix, 'org')

  const { organizations } = await fetch(trpc.organization.list.queryOptions())

  console.log('organizations', organizations.map(w => w.id), organizationId)
  const organization = organizations.find((w) => w.id === organizationId)
  if (!organization) {
    await createCaller(createContext).organization.setActive({
      organizationId: null,
    })

    redirect('/org')
    return null
  }

  const redirectToWorkspace = false

  // TODO: preference
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!redirectToWorkspace) {
    prefetch(trpc.workspace.list.queryOptions())
  } else {
    const { workspaces: allWorkspaces } = await fetch(trpc.workspace.list.queryOptions())
    const workspaces = allWorkspaces.filter((w) => w.organizationId === organizationId)

    let lastWorkspace = (await cookies()).get(lastWorkspaceCookieName)?.value
    if (!lastWorkspace || !workspaces.some((w) => w.id === lastWorkspace)) {
      lastWorkspace = workspaces[0]?.id
    }

    if (lastWorkspace) {
      redirect(`/workspace/${stripIdPrefix(lastWorkspace)}/apps`)
    }
  }

  return (
    <>
      <RememberOrganization id={organizationId} />
      {/* TopBar for organization switching */}
      <HydrateClient>
        <AppTopBar />
      </HydrateClient>
      {children}
    </>
  )
}
