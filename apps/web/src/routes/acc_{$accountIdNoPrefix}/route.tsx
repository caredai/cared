import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { RememberAccount } from '@/components/remember-account'
import { Section } from '@/components/section'
import { getActiveAccountId } from '@/lib/active'
import { orpc } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { AccountNavMain } from './-nav-main'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}')({
  beforeLoad: async ({ context, params }) => {
    await prefetchAndCheckSession(context.queryClient)

    const { activeAccountId, activeAccountIdNoPrefix } = await getActiveAccountId(params)

    const { accounts } = await context.queryClient.ensureQueryData(
      orpc.account.account.list.queryOptions(),
    )

    const account = accounts.find((a) => a.id === activeAccountId)
    if (!account) {
      throw redirect({ to: '/' })
    }

    void context.queryClient.prefetchQuery(orpc.account.app.list.queryOptions())

    return {
      activeAccountId,
      activeAccountIdNoPrefix,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { activeAccountId, activeAccountIdNoPrefix } = Route.useRouteContext()

  return (
    <SidebarProvider className="flex flex-col">
      <AppTopBar />

      <div className="flex flex-1">
        <AppSidebar baseUrl={`/acc_${activeAccountIdNoPrefix}/credits`}>
          <AccountNavMain baseUrl={`/acc_${activeAccountIdNoPrefix}`} />
        </AppSidebar>

        <div className="flex-1 flex flex-col h-[calc(100dvh-57px)] overflow-y-auto overflow-x-hidden">
          <SidebarInset>
            <Section>
              <Outlet />
            </Section>

            <RememberAccount id={activeAccountId} />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
