import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@cared/ui/components/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { ErrorFallback } from '@/components/error-fallback'
import { NavMain } from '@/components/nav-main'
import { ForgetOrganization } from '@/components/remember-organization'
import { fetch, HydrateClient, prefetch, trpc } from '@/trpc/server'

const items = [
  {
    title: 'Credits',
    url: '/credits',
    icon: 'CircleDollarSign',
  },
  {
    title: 'Wallet',
    url: '/wallet',
    icon: 'Wallet',
  },
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
  {
    title: 'Applications',
    url: '/applications',
    icon: 'Bot',
  },
]

export default async function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const session = await fetch(trpc.user.session.queryOptions())
  if (!session) {
    redirect('/auth/sign-in')
  }

  prefetch(trpc.user.session.queryOptions())
  prefetch(trpc.user.accounts.queryOptions())
  prefetch(trpc.credits.getCredits.queryOptions())

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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

          <ForgetOrganization />
          <HydrateClient>{children}</HydrateClient>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
