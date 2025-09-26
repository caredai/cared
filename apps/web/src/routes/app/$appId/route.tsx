import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { Section } from '@/components/section'
import { orpc } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { addIdPrefix } from '@/lib/utils'
import { AppNavMain } from './-nav-main'

export const Route = createFileRoute('/app/$appId')({
  beforeLoad: async ({ params }) => {
    await prefetchAndCheckSession()

    const { appId: appIdNoPrefix } = params
    const appId = addIdPrefix(appIdNoPrefix, 'app')

    return {
      appId,
      appIdNoPrefix,
    }
  },
  loader: async ({ context, params }) => {
    const { appId: appIdNoPrefix } = params
    const appId = addIdPrefix(appIdNoPrefix, 'app')

    void context.queryClient.prefetchQuery(orpc.organization.list.queryOptions())
    void context.queryClient.prefetchQuery(orpc.workspace.list.queryOptions())
    void context.queryClient.prefetchQuery(orpc.app.list.queryOptions())
    void context.queryClient.prefetchQuery(orpc.model.listProvidersModels.queryOptions())
    void context.queryClient.prefetchQuery(orpc.model.listDefaultModels.queryOptions())

    // Ensure app data is loaded
    await context.queryClient.ensureQueryData(
      orpc.app.byId.queryOptions({
        input: {
          id: appId,
        },
      }),
    )
  },
  component: AppLayout,
})

function AppLayout() {
  const { appIdNoPrefix } = Route.useRouteContext()

  return (
    <SidebarProvider defaultOpen={false} className="flex flex-col">
      <AppTopBar />

      <div className="flex flex-1">
        <AppSidebar collapsible="icon" baseUrl="/">
          <AppNavMain baseUrl={`/app/${appIdNoPrefix}`} />
        </AppSidebar>

        <div className="flex-1 flex flex-col h-[calc(100svh-57px)] overflow-y-auto overflow-x-hidden">
          <SidebarInset>
            <Section>
              <Outlet />
            </Section>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
