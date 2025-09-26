/// <reference types="vite/client" />

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Toaster } from '@cared/ui/components/sonner'

import type { QueryClient } from '@tanstack/react-query'
import { ErrorComponent } from '@/components/error-component'
import { NotFoundComponent } from '@/components/not-found-component'
import { Providers } from '@/components/providers'
import globalsCss from '../globals.css?url'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Cared | AI + Web3 SaaS Platform',
      },
      {
        name: 'description',
        content:
          'Transform your business with Cared - the leading AI and Web3 SaaS platform. Build, deploy, and scale intelligent decentralized applications with cutting-edge technology.',
      },
    ],
    links: [{ rel: 'stylesheet', href: globalsCss }],
  }),
  component: RootLayout,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
})

export default function RootLayout() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="overscroll-none">
        <Providers>
          <Outlet />
        </Providers>
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
