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

  prefetch(trpc.user.accounts.queryOptions())
  prefetch(trpc.credits.getCredits.queryOptions())
  prefetch(trpc.organization.list.queryOptions())
  prefetch(trpc.workspace.list.queryOptions())

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <AppTopBar />
        <SidebarProvider>
          <AppSidebar baseUrl="/">
            <AccountNavMain />
          </AppSidebar>

          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
              </div>
            </header>

            <ForgetOrganization />

            {children}
          </SidebarInset>
        </SidebarProvider>
      </ErrorBoundary>
    </HydrateClient>
  )
}
