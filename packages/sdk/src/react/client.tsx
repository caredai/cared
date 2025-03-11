'use client'

import type { QueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, loggerLink, unstable_httpBatchStreamLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import SuperJSON from 'superjson'

import type { API } from '..'
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

export const { useTRPC, TRPCProvider } = createTRPCContext<API>()

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() => createTrpcClient())

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient as any} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}

export function createTrpcClient() {
  return createTRPCClient<API>({
    links: [
      loggerLink({
        enabled: (op) =>
          process.env.NODE_ENV === 'development' ||
          (op.direction === 'down' && op.result instanceof Error),
      }),
      unstable_httpBatchStreamLink({
        transformer: SuperJSON,
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        url: process.env.MIND_API_URL ?? 'https://mindai.world/api/trpc',
        headers() {
          const headers = new Headers()
          // eslint-disable-next-line turbo/no-undeclared-env-vars
          headers.set('Authorization', 'Bearer ' + process.env.MIND_API_KEY)
          headers.set('X-AUTH-TYPE', 'API-KEY') // optional
          headers.set('x-trpc-source', 'react')
          return headers
        },
      }),
    ],
  })
}
