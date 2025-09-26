import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { RememberOrganization } from '@/components/remember-organization'
import { Section } from '@/components/section'
import { getActiveOrganizationId } from '@/lib/active'
import { lastWorkspaceCookieName } from '@/lib/cookie'
import { orpc, orpcClient } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { stripIdPrefix } from '@/lib/utils'
import { OrganizationNavMain } from './-nav-main'

const getLastWorkspace = createServerFn().handler(() => getCookie(lastWorkspaceCookieName))

export const Route = createFileRoute('/org/$organizationId')({
  beforeLoad: async ({ context, params }) => {
    await prefetchAndCheckSession()

    const { activeOrganizationId, activeOrganizationIdNoPrefix } =
      await getActiveOrganizationId(params)

    const { organizations } = await context.queryClient.ensureQueryData(
      orpc.organization.list.queryOptions(),
    )

    const organization = organizations.find((w) => w.id === activeOrganizationId)
    if (!organization) {
      await orpcClient.organization.setActive({
        organizationId: null,
      })
      throw redirect({ to: '/org' })
    }

    const redirectToWorkspace = false

    // TODO: preference
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!redirectToWorkspace) {
      void context.queryClient.prefetchQuery(orpc.workspace.list.queryOptions())
    } else {
      const { workspaces: allWorkspaces } = await context.queryClient.fetchQuery(
        orpc.workspace.list.queryOptions(),
      )
      const workspaces = allWorkspaces.filter((w) => w.organizationId === activeOrganizationId)

      let lastWorkspace = await getLastWorkspace()
      if (!lastWorkspace || !workspaces.some((w) => w.id === lastWorkspace)) {
        lastWorkspace = workspaces[0]?.id
      }

      if (lastWorkspace) {
        throw redirect({ to: `/workspace/${stripIdPrefix(lastWorkspace)}/apps` })
      }
    }

    void context.queryClient.prefetchQuery(orpc.app.list.queryOptions())

    return {
      activeOrganizationId,
      activeOrganizationIdNoPrefix,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { activeOrganizationId, activeOrganizationIdNoPrefix } = Route.useRouteContext()

  return (
    <SidebarProvider className="flex flex-col">
      <AppTopBar />

      <div className="flex flex-1">
        <AppSidebar baseUrl={`/org/${activeOrganizationIdNoPrefix}/credits`}>
          <OrganizationNavMain baseUrl={`/org/${activeOrganizationIdNoPrefix}`} />
        </AppSidebar>

        <div className="flex-1 flex flex-col h-[calc(100svh-57px)] overflow-y-auto overflow-x-hidden">
          <SidebarInset>
            <Section>
              <Outlet />
            </Section>

            <RememberOrganization id={activeOrganizationId as string | undefined} />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
