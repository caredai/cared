import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { Section } from '@/components/section'
import { orpc } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { addIdPrefix } from '@/lib/utils'
import { DatabaseNavMain } from './-nav-main'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}')({
  beforeLoad: async ({ context, params }) => {
    await prefetchAndCheckSession(context.queryClient)

    const { accountIdNoPrefix, namespaceIdNoPrefix } = params
    const namespaceId = addIdPrefix(namespaceIdNoPrefix, 'neon')

    return {
      accountIdNoPrefix,
      namespaceIdNoPrefix,
      namespaceId,
    }
  },
  loader: async ({ context, params }) => {
    const namespaceId = addIdPrefix(params.namespaceIdNoPrefix, 'neon')

    void context.queryClient.prefetchQuery(orpc.account.database.listNamespaces.queryOptions())
    await Promise.all([
      context.queryClient.ensureQueryData(
        orpc.account.database.getNamespace.queryOptions({
          input: { id: namespaceId },
        }),
      ),
      context.queryClient.ensureQueryData(
        orpc.account.database.listBranches.queryOptions({
          input: { namespaceId, limit: 100 },
        }),
      ),
      context.queryClient.ensureQueryData(
        orpc.account.database.listEndpoints.queryOptions({
          input: { namespaceId },
        }),
      ),
      context.queryClient.ensureQueryData(
        orpc.account.database.countBranches.queryOptions({
          input: { namespaceId },
        }),
      ),
    ])
  },
  component: DatabaseNamespaceLayout,
})

function DatabaseNamespaceLayout() {
  const { accountIdNoPrefix, namespaceIdNoPrefix, namespaceId } = Route.useRouteContext()
  const baseUrl = `/acc_${accountIdNoPrefix}/database_${namespaceIdNoPrefix}`

  return (
    <SidebarProvider className="flex flex-col">
      <AppTopBar />

      <div className="flex flex-1">
        <AppSidebar baseUrl="/">
          <DatabaseNavMain baseUrl={baseUrl} namespaceId={namespaceId} />
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
