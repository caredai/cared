import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@mindworld/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { ErrorFallback } from '@/components/error-fallback'
import { MenuBreadcrumb } from '@/components/menu-breadcrumb'
import { NavMain } from '@/components/nav-main'
import { RememberWorkspace } from '@/components/remember-workspace'
import { WorkspaceSwitcher } from '@/components/workspace-switcher'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

const items = [
  {
    title: 'Apps',
    url: '/apps',
    icon: 'Bot',
  },
  {
    title: 'Knowledge',
    url: '/datasets',
    icon: 'Database',
  },
  {
    title: 'Tools',
    url: '/tools',
    icon: 'Wrench',
  },
  {
    title: 'Models',
    url: '/models',
    icon: 'Brain',
  },
  {
    title: 'Extensions',
    url: '/extensions',
    icon: 'Puzzle',
  },
  {
    title: 'Settings',
    url: '/settings/general',
    icon: 'Settings2',
  },
]

export default async function WorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ workspaceId: string }>
}>) {
  const { workspaceId } = await params

  prefetch(trpc.user.me.queryOptions())
  prefetch(trpc.user.accounts.queryOptions())
  prefetch(
    trpc.workspace.get.queryOptions({
      id: workspaceId,
    }),
  )
  prefetch(trpc.workspace.list.queryOptions())

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {/*<Suspense fallback={<Loading />}>*/}
      <SidebarProvider>
        <AppSidebar baseUrl={`/${workspaceId}`}>
          <NavMain items={items} baseUrl={`/${workspaceId}`}>
            <HydrateClient>
              <WorkspaceSwitcher />
            </HydrateClient>
          </NavMain>
        </AppSidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <MenuBreadcrumb items={items} baseUrl={`/${workspaceId}`} />
            </div>
          </header>
          <RememberWorkspace id={workspaceId} />
          {children}
        </SidebarInset>
      </SidebarProvider>
      {/*</Suspense>*/}
    </ErrorBoundary>
  )
}
