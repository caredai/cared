'use client'

import type { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from '@tavern/api'
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createTRPCClient, loggerLink, unstable_httpBatchStreamLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import SuperJSON from 'superjson'

import { env } from '@/env'
import { createQueryClient } from './query-client'

let clientQueryClientSingleton: QueryClient | undefined = undefined
const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient()
  } else {
    // Browser: use singleton pattern to keep the same query client
    return (clientQueryClientSingleton ??= createQueryClient())
  }
}

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>()

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        unstable_httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + '/api/trpc',
          headers() {
            const headers = new Headers()
            headers.set('x-trpc-source', 'nextjs-react')
            return headers
          },
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`
}
