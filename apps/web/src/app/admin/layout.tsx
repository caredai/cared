import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'

import { authenticate } from '@cared/api'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { ErrorFallback } from '@/components/error-fallback'
import { MenuBreadcrumb } from '@/components/menu-breadcrumb'
import { NavMain } from '@/components/nav-main'
import { prefetch, trpc } from '@/trpc/server'

const items = [
  {
    title: 'Apps',
    url: '/apps',
    icon: 'Bot',
    isRoute: true,
    items: [
      {
        title: 'Categories',
        url: '/categories',
      },
      {
        title: 'Tags',
        url: '/tags',
      },
    ],
  },
  {
    title: 'Mock',
    url: '/mock',
    icon: 'DatabaseZap',
  },
]

export default async function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const auth = await authenticate()
  if (!auth.isAdmin()) {
    redirect('/')
  }

  prefetch(trpc.user.session.queryOptions())
  prefetch(trpc.user.accounts.queryOptions())

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SidebarProvider>
        <AppSidebar baseUrl="/admin">
          <NavMain items={items} baseUrl="/admin" />
        </AppSidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <MenuBreadcrumb items={items} baseUrl="/admin" />
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
