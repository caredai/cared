import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { ErrorFallback } from '@/components/error-fallback'
import { ForgetOrganization } from '@/components/remember-organization'
import { prefetchAndCheckSession } from '@/lib/session'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { AccountNavMain } from './nav-main'

export default async function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  if (!(await prefetchAndCheckSession())) {
    return
  }

  prefetch(trpc.organization.list.queryOptions())
  prefetch(trpc.workspace.list.queryOptions())
  prefetch(trpc.app.list.queryOptions())

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SidebarProvider className="flex flex-col">
          <AppTopBar />

          <div className="flex flex-1">
            <AppSidebar baseUrl="/">
              <AccountNavMain />
            </AppSidebar>

            <div className="flex-1 flex flex-col h-[calc(100svh-57px)] overflow-y-auto">
              <SidebarInset>
                <div className="hidden md:flex items-center p-4">
                  <SidebarTrigger />
                </div>

                <ForgetOrganization />

                {children}
              </SidebarInset>
            </div>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </HydrateClient>
  )
}
