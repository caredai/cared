import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@mindworld/ui/components/sidebar'

import { AdminBreadcrumb } from '@/components/admin-breadcrumb'
import { AdminNavMain } from '@/components/admin-nav-main'
import { AppSidebar } from '@/components/app-sidebar'
import { ErrorFallback } from '@/components/error-fallback'
import { prefetch, trpc } from '@/trpc/server'

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  prefetch(trpc.user.me.queryOptions())

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <SidebarProvider>
        <AppSidebar mainRoute="./">
          <AdminNavMain />
        </AppSidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <AdminBreadcrumb />
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
