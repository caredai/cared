import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { prefetchSession } from '@daveyplate/better-auth-tanstack/server'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

import { auth } from '@mindworld/auth'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@mindworld/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { ErrorFallback } from '@/components/error-fallback'
import { NavMain } from '@/components/nav-main'
import { prefetch, trpc } from '@/trpc/server'

const items = [
  {
    title: 'Profile',
    url: '/profile',
    icon: 'Bot',
  },
  {
    title: 'Security',
    url: '/security',
    icon: 'DatabaseZap',
  },
]

export default async function AccountLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  prefetch(trpc.user.me.queryOptions())

  const queryClient = new QueryClient()

  void prefetchSession(auth, queryClient, {
    headers: await headers(),
  })

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <SidebarProvider>
        <AppSidebar baseUrl="/account">
          <NavMain items={items} baseUrl="/account" />
        </AppSidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>

          <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
