import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'

import { SidebarInset, SidebarProvider } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppTopBar } from '@/components/app-topbar'
import { ErrorFallback } from '@/components/error-fallback'
import { RememberWorkspace } from '@/components/remember-workspace'
import { Section } from '@/components/section'
import { addIdPrefix } from '@/lib/utils'
import { fetch, HydrateClient, prefetch, trpc } from '@/trpc/server'
import { WorkspaceNavMain } from './nav-main'
import { prefetchAndCheckSession } from '@/lib/session'

export default async function WorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ workspaceId: string }>
}>) {
  const { workspaceId: workspaceIdNoPrefix } = await params
  const workspaceId = addIdPrefix(workspaceIdNoPrefix, 'workspace')

  if (!(await prefetchAndCheckSession())) {
    return
  }

  const { workspaces } = await fetch(trpc.workspace.list.queryOptions())

  const workspace = workspaces.find((w) => w.id === workspaceId)
  if (!workspace) {
    redirect('/')
    return null
  }

  prefetch(trpc.organization.list.queryOptions())
  prefetch(trpc.app.list.queryOptions())

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {/*<Suspense fallback={<Loading />}>*/}
        <SidebarProvider className="flex flex-col">
          <AppTopBar />

          <div className="flex flex-1">
            <AppSidebar baseUrl={`/workspace/${workspaceIdNoPrefix}/apps`}>
              <WorkspaceNavMain baseUrl={`/workspace/${workspaceIdNoPrefix}`} />
            </AppSidebar>

            <div className="flex-1 flex flex-col h-[calc(100svh-57px)] overflow-y-auto">
              <SidebarInset>
                <Section>{children}</Section>

                <RememberWorkspace id={workspaceId} />
              </SidebarInset>
            </div>
          </div>
        </SidebarProvider>
        {/*</Suspense>*/}
      </ErrorBoundary>
    </HydrateClient>
  )
}
