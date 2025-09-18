import { cache } from 'react'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { dehydrate, HydrationBoundary, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import type { AppRouter } from '@cared/api'
import { getBaseUrl } from '@cared/auth/client'

import type { RouterClient } from '@orpc/server'
import type { QueryOptionsBase } from '@orpc/tanstack-query'
import type {
  DefaultError,
  FetchQueryOptions,
  InferDataFromTag,
  QueryClient,
  QueryKey,
  SetDataOptions,
  Updater,
} from '@tanstack/react-query'
import { createQueryClient } from './query-client'

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace globalThis {
  let $orpc: RouterClient<AppRouter> | undefined
}

const link = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('RPCLink is not allowed on the server side.')
    }

    return `${getBaseUrl()}/api/rpc`
  },
  headers: () => {
    const headers = new Headers()
    headers.set('x-orpc-source', 'nextjs-react')
    return headers
  },
})

/**
 * Fallback to client-side client if server-side client is not available.
 */
export const orpcClient: RouterClient<AppRouter> = globalThis.$orpc ?? createORPCClient(link)
export const orpc = createTanstackQueryUtils(orpcClient)

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

export function RPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      {children}
    </QueryClientProvider>
  )
}

export const getCachedQueryClient = cache(createQueryClient)

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getCachedQueryClient()
  return <HydrationBoundary state={dehydrate(queryClient)}>{props.children}</HydrationBoundary>
}

export function prefetch<T extends QueryOptionsBase<any, any>>(queryOptions: T) {
  const queryClient = getCachedQueryClient()
  // @ts-ignore
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    void queryClient.prefetchInfiniteQuery(queryOptions as any)
  } else {
    void queryClient.prefetchQuery(queryOptions)
  }
}

export function fetch<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>(
  queryOptions: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
): Promise<TData> {
  const queryClient = getCachedQueryClient()
  return queryClient.fetchQuery(queryOptions)
}

export function setData<
  TQueryFnData = unknown,
  TTaggedQueryKey extends QueryKey = QueryKey,
  TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
>(
  queryKey: TTaggedQueryKey,
  updater: Updater<
    NoInfer<TInferredQueryFnData> | undefined,
    NoInfer<TInferredQueryFnData> | undefined
  >,
  options?: SetDataOptions,
): NoInfer<TInferredQueryFnData> | undefined {
  const queryClient = getCachedQueryClient()
  return queryClient.setQueryData<TQueryFnData, TTaggedQueryKey, TInferredQueryFnData>(
    queryKey,
    updater,
    options,
  )
}
