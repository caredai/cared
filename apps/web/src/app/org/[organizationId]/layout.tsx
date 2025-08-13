import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AppTopBar } from '@/components/app-topbar'
import { RememberOrganization } from '@/components/remember-organization'
import { lastWorkspaceCookieName } from '@/lib/cookie'
import { addIdPrefix, stripIdPrefix } from '@/lib/utils'
import { fetch, HydrateClient, prefetch, trpc } from '@/trpc/server'

export default async function OrganizationLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ Organization: string }>
}>) {
  const { Organization: orgIdNoPrefix } = await params
  const organizationId = addIdPrefix(orgIdNoPrefix, 'org')

  const redirectToWorkspace = false

  // TODO: preference
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!redirectToWorkspace) {
    prefetch(trpc.workspace.list.queryOptions())
  } else {
    const { workspaces } = await fetch(trpc.workspace.list.queryOptions())

    let lastWorkspace = (await cookies()).get(lastWorkspaceCookieName)?.value
    if (
      !lastWorkspace ||
      !workspaces
        .filter((w) => w.organizationId === organizationId)
        .some((w) => w.id === lastWorkspace)
    ) {
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
