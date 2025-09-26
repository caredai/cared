import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { Section } from '@/components/section'
import { orpc } from '@/lib/orpc'
import { prefetchAndCheckSession } from '@/lib/session'
import { AdminNavMain } from './-nav-main'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    // Check if user has admin role
    await prefetchAndCheckSession('/', (session) => session.user.role === 'admin')
  },
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.user.accounts.queryOptions())
  },
  component: () => {
    return (
      <SidebarProvider>
        <AppSidebar baseUrl="/admin" alwaysShowLogo showNavUser>
          <AdminNavMain />
        </AppSidebar>

        <div className="flex-1 flex flex-col h-[calc(100svh-57px)] overflow-y-auto overflow-x-hidden">
          <SidebarInset>
            <Section>
              <Outlet />
            </Section>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  },
})
