import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@ownxai/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { ErrorFallback } from '@/components/error-fallback'
import { NavMain } from '@/components/nav-main'
import { WorkspaceEnterButton } from '@/components/workspace-enter-button'
import { addIdPrefix } from '@/lib/utils'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

const items = [
  {
    title: 'Design',
    url: '/',
    icon: 'WandSparkles',
  },
  {
    title: 'Logs',
    url: '/logs',
    icon: 'FerrisWheel',
  },
  {
    title: 'Configure',
    url: '/configure/oauth-application',
    icon: 'Settings2',
  },
]

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

  prefetch(trpc.workspace.list.queryOptions())
  prefetch(trpc.user.me.queryOptions())
  prefetch(
    trpc.app.byId.queryOptions({
      id: appId,
    }),
  )

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar collapsible="icon" baseUrl="/">
          <NavMain items={items} baseUrl={`/app/${appIdNoPrefix}`}>
            <HydrateClient>
              <WorkspaceEnterButton />
            </HydrateClient>
          </NavMain>
        </AppSidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>

          <HydrateClient>{children}</HydrateClient>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
