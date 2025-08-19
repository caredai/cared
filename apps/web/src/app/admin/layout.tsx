import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { ErrorFallback } from '@/components/error-fallback'
import { prefetchAndCheckSession } from '@/lib/session'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { AdminMenuBreadcrumb, AdminNavMain } from './nav-main'

export default async function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  if (!(await prefetchAndCheckSession('/', (session) => session.user.role === 'admin'))) {
    return
  }

  prefetch(trpc.user.accounts.queryOptions())

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SidebarProvider>
          <AppSidebar baseUrl="/admin">
            <AdminNavMain />
          </AppSidebar>

          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <AdminMenuBreadcrumb />
              </div>
            </header>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </ErrorBoundary>
    </HydrateClient>
  )
}
