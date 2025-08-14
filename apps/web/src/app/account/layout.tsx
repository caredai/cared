import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { ErrorFallback } from '@/components/error-fallback'
import { ForgetOrganization } from '@/components/remember-organization'
import { fetch, HydrateClient, prefetch, trpc } from '@/trpc/server'
import { AccountNavMain } from './nav-main'

export default async function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const session = await fetch(trpc.user.session.queryOptions())
  if (!session) {
    redirect('/auth/sign-in')
  }

  prefetch(trpc.organization.list.queryOptions())
  prefetch(trpc.workspace.list.queryOptions())

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SidebarProvider className="flex flex-col">
          <AppTopBar />

          <div className="flex flex-1">
            <AppSidebar baseUrl="/">
              <AccountNavMain />
            </AppSidebar>

            <div className="flex-1 h-[calc(100svh-57px)] overflow-y-auto">
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
