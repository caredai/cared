import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { ForgetOrganization } from '@/components/remember-organization'
import { Section } from '@/components/section'
import { orpc } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { AccountNavMain } from './-nav-main'

export const Route = createFileRoute('/account')({
  beforeLoad: async () => {
    await prefetchAndCheckSession()
  },
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.organization.list.queryOptions())
    void context.queryClient.prefetchQuery(orpc.workspace.list.queryOptions())
    void context.queryClient.prefetchQuery(orpc.app.list.queryOptions())
  },
  component: () => {
    return (
      <SidebarProvider className="flex flex-col">
        <AppTopBar />

        <div className="flex flex-1">
          <AppSidebar baseUrl="/">
            <AccountNavMain />
          </AppSidebar>

          <div className="flex-1 flex flex-col h-[calc(100svh-57px)] overflow-y-auto overflow-x-hidden">
            <SidebarInset>
              <Section>
                <Outlet />
              </Section>

              <ForgetOrganization />
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    )
  },
})
