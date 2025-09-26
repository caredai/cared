import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { RememberWorkspace } from '@/components/remember-workspace'
import { Section } from '@/components/section'
import { orpc } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { addIdPrefix } from '@/lib/utils'
import { WorkspaceNavMain } from './-nav-main'

export const Route = createFileRoute('/workspace/$workspaceId')({
  beforeLoad: async ({ context, params }) => {
    await prefetchAndCheckSession()

    const workspaceIdNoPrefix = params.workspaceId
    const workspaceId = addIdPrefix(workspaceIdNoPrefix, 'workspace')

    const { workspaces } = await context.queryClient.ensureQueryData(
      orpc.workspace.list.queryOptions(),
    )

    const workspace = workspaces.find((w) => w.id === workspaceId)
    if (!workspace) {
      throw redirect({ to: '/' })
    }

    // Prefetch related data
    void context.queryClient.prefetchQuery(orpc.organization.list.queryOptions())
    void context.queryClient.prefetchQuery(orpc.app.list.queryOptions())

    return {
      workspaceId,
      workspaceIdNoPrefix,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { workspaceId, workspaceIdNoPrefix } = Route.useRouteContext()

  return (
    <SidebarProvider className="flex flex-col">
      <AppTopBar />

      <div className="flex flex-1">
        <AppSidebar baseUrl={`/workspace/${workspaceIdNoPrefix}/apps`}>
          <WorkspaceNavMain baseUrl={`/workspace/${workspaceIdNoPrefix}`} />
        </AppSidebar>

        <div className="flex-1 flex flex-col h-[calc(100svh-57px)] overflow-y-auto overflow-x-hidden">
          <SidebarInset>
            <Section>
              <Outlet />
            </Section>

            <RememberWorkspace id={workspaceId} />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
