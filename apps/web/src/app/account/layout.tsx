import type { ReactNode } from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'

import { auth } from '@mindworld/auth'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@mindworld/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { ErrorFallback } from '@/components/error-fallback'
import { NavMain } from '@/components/nav-main'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

const items = [
  {
    title: 'Profile',
    url: '/profile',
    icon: 'UserRound',
  },
  {
    title: 'Security',
    url: '/security',
    icon: 'ShieldCheck',
  },
]

export default async function AccountLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  })
  if (!session) {
    redirect('/auth/sign-in')
  }

  prefetch(trpc.user.me.queryOptions())
  prefetch(trpc.user.accounts.queryOptions())

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <SidebarProvider>
        <AppSidebar baseUrl="/">
          <NavMain items={items} baseUrl="/account" />
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
