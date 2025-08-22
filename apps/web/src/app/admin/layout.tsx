import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { ErrorFallback } from '@/components/error-fallback'
import { Section } from '@/components/section'
import { prefetchAndCheckSession } from '@/lib/session'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { AdminNavMain } from './nav-main'

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
          <AppSidebar baseUrl="/admin" alwaysShowLogo>
            <AdminNavMain />
          </AppSidebar>

          <div className="flex-1 flex flex-col h-[calc(100svh-57px)] overflow-y-auto overflow-x-hidden">
            <SidebarInset>
              <Section>{children}</Section>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </HydrateClient>
  )
}
