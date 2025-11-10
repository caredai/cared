import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { Section } from '@/components/section'
import { orpc } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { UserNavMain } from './-nav-main'

export const Route = createFileRoute('/user')({
  beforeLoad: async ({ context }) => {
    await prefetchAndCheckSession(context.queryClient)
  },
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.account.list.queryOptions())
    void context.queryClient.prefetchQuery(orpc.app.list.queryOptions())
  },
  component: () => {
    return (
      <SidebarProvider className="flex flex-col">
        <AppTopBar />

        <div className="flex flex-1">
          <AppSidebar baseUrl="/">
            <UserNavMain />
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
  },
})
