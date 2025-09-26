import { cache } from 'react'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { BatchLinkPlugin } from '@orpc/client/plugins'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import type { AppRouter } from '@cared/api'
import { getApiUrl } from '@cared/auth/client'

import type { RouterClient } from '@orpc/server'
import type { QueryOptionsBase } from '@orpc/tanstack-query'
import type {
  DefaultError,
  FetchQueryOptions,
  InferDataFromTag,
  QueryKey,
  SetDataOptions,
  Updater,
} from '@tanstack/react-query'
import { createQueryClient } from './query-client'

const getHeaders = createIsomorphicFn()
  .server(() => new Headers(getRequestHeaders()))
  .client(() => new Headers())

const link = new RPCLink({
  url: () => {
    return `${getApiUrl()}/api/rpc`
  },
  headers: () => {
    const headers = getHeaders()
    headers.set('x-orpc-source', 'cared-web')
    return headers
  },
  fetch: (request, init) => {
    return globalThis.fetch(request, {
      ...init,
      credentials: 'include', // Include cookies for cross-origin requests
    })
  },
  plugins: [
    new BatchLinkPlugin({
      groups: [
        {
          condition: () => true,
          context: {},
        },
      ],
    }),
  ],
})

export const orpcClient: RouterClient<AppRouter> = createORPCClient(link)
export const orpc = createTanstackQueryUtils(orpcClient)

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
