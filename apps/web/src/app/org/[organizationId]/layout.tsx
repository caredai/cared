import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createCaller } from '@cared/api'

import { RememberOrganization } from '@/components/remember-organization'
import { lastWorkspaceCookieName } from '@/lib/cookie'
import { addIdPrefix, stripIdPrefix } from '@/lib/utils'
import { createContext, prefetch, trpc } from '@/trpc/server'

export default async function OrganizationLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ Organization: string }>
}>) {
  const { Organization: orgIdNoPrefix } = await params
  const organizationId = addIdPrefix(orgIdNoPrefix, 'org')

  prefetch(
    trpc.organization.get.queryOptions({
      id: organizationId,
    }),
  )

  const redirectToWorkspace = false

  // TODO: preference
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!redirectToWorkspace) {
    prefetch(
      trpc.workspace.list.queryOptions({
        organizationId: organizationId,
      }),
    )
  } else {
    const { workspaces } = await createCaller(createContext).workspace.list({
      organizationId: organizationId,
    })

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
      {children}
    </>
  )
}
