import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { Section } from '@/components/section'
import { orpc } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { addIdPrefix } from '@/lib/utils'
import { AppNavMain } from './-nav-main'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}_/app_{$appIdNoPrefix}')({
  beforeLoad: async ({ context, params }) => {
    await prefetchAndCheckSession(context.queryClient)

    const { accountIdNoPrefix, appIdNoPrefix } = params

    return {
      accountIdNoPrefix,
      appIdNoPrefix,
    }
  },
  loader: async ({ context, params }) => {
    const { appIdNoPrefix } = params
    const appId = addIdPrefix(appIdNoPrefix, 'app')

    void context.queryClient.prefetchQuery(orpc.account.list.queryOptions())
    void context.queryClient.prefetchQuery(orpc.app.list.queryOptions())
    void context.queryClient.prefetchQuery(orpc.model.listProvidersModels.queryOptions())

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
  const { accountIdNoPrefix, appIdNoPrefix } = Route.useRouteContext()

  return (
    <SidebarProvider defaultOpen={false} className="flex flex-col">
      <AppTopBar />

      <div className="flex flex-1">
        <AppSidebar collapsible="icon" baseUrl="/">
          <AppNavMain baseUrl={`/acc_${accountIdNoPrefix}/app_${appIdNoPrefix}`} />
        </AppSidebar>

        <div className="flex-1 flex flex-col h-[calc(100dvh-57px)] overflow-y-auto overflow-x-hidden">
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
