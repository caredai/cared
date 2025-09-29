import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { BatchLinkPlugin } from '@orpc/client/plugins'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import type { AppRouter } from '@cared/api'
import { getApiUrl } from '@cared/auth/client'

import type { RouterClient } from '@orpc/server'

let apiWorker: Fetcher | undefined = undefined

export function setApiWorker(aw: Fetcher) {
  apiWorker ??= aw
}

const isomorphicHeaders = createIsomorphicFn()
  .server(() => {
    const headers = new Headers(getRequestHeaders())
    headers.set('x-orpc-source', 'cared-web-server')
    return headers
  })
  .client(() => {
    const headers = new Headers()
    headers.set('x-orpc-source', 'cared-web-client')
    return headers
  })

const isomorphicFetch = createIsomorphicFn()
  .server(async (...args: Parameters<typeof globalThis.fetch>) => {
    if (apiWorker) {
      const response = await apiWorker.fetch(...args)
      // console.log(
      //   'cf placement',
      //   response.headers.get('cf-placement'),
      //   response.headers.get('cf-ray'),
      // )
      return response
    } else {
      return globalThis.fetch(...args)
    }
  })
  .client((...args: Parameters<typeof globalThis.fetch>) => {
    return globalThis.fetch(...args)
  })

const isomorphicRedirect = createIsomorphicFn()
  .server(() => {
    throw redirect({
      to: '/auth/sign-in',
    })
  })
  .client(() => {
    window.location.href = '/auth/sign-in'
  })

const link = new RPCLink({
  url: () => {
    return `${getApiUrl()}/api/rpc`
  },
  headers: () => isomorphicHeaders(),
  fetch: (request, init) => {
    return isomorphicFetch(request, {
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
  interceptors: [
    // eslint-disable-next-line @typescript-eslint/unbound-method
    async ({ next }) => {
      try {
        return await next()
      } catch (error) {
        // Redirect to sign-in if the rpc call returned an unauthorized error
        if (error instanceof ORPCError && error.code === 'UNAUTHORIZED') {
          isomorphicRedirect()
        }
        throw error
      }
    },
  ],
})

export const orpcClient: RouterClient<AppRouter> = createORPCClient(link)
export const orpc = createTanstackQueryUtils(orpcClient)
