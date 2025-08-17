import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { ErrorFallback } from '@/components/error-fallback'
import { Section } from '@/components/section'
import { addIdPrefix } from '@/lib/utils'
import { fetch, HydrateClient, prefetch, trpc } from '@/trpc/server'
import { AppNavMain } from './nav-main'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<{
    appId: string
  }>
  children: ReactNode
}>) {
  const { appId: appIdNoPrefix } = await params
  const appId = addIdPrefix(appIdNoPrefix, 'app')

  prefetch(trpc.user.session.queryOptions())
  prefetch(trpc.organization.list.queryOptions())
  prefetch(trpc.workspace.list.queryOptions())
  prefetch(trpc.app.list.queryOptions())

  const { app } = await fetch(
    trpc.app.byId.queryOptions({
      id: appId,
    }),
  )

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SidebarProvider defaultOpen={false} className="flex flex-col">
          <AppTopBar />

          <div className="flex flex-1">
            <AppSidebar collapsible="icon" baseUrl="/">
              <AppNavMain baseUrl={`/app/${appIdNoPrefix}`} />
            </AppSidebar>

            <div className="flex-1 flex flex-col h-[calc(100svh-57px)] overflow-y-auto">
              <SidebarInset>
                <Section>{children}</Section>
              </SidebarInset>
            </div>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </HydrateClient>
  )
}
