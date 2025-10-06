import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { BatchLinkPlugin } from '@orpc/client/plugins'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'

import type { AppRouter } from '@cared/api'

import type { CaredClientOptions } from './client'
import type { InferRouterInputs, InferRouterOutputs, RouterClient } from '@orpc/server'
import type { RouterUtils } from '@orpc/tanstack-query'
import { makeHeaders } from './client'

export type CaredOrpcRouterInputs = InferRouterInputs<AppRouter>
export type CaredOrpcRouterOutputs = InferRouterOutputs<AppRouter>

export type Chat = CaredOrpcRouterOutputs['chat']['byId']['chat']
export type Message = CaredOrpcRouterOutputs['message']['get']['message']

export function createCaredOrpcClient(
  opts: CaredClientOptions & Required<Pick<CaredClientOptions, 'apiUrl'>>,
): {
  orpcClient: CaredOrpcClient
  orpc: CaredOrpcQueryClient
} {
  const link = new RPCLink({
    url: opts.apiUrl + '/orpc',
    headers: async () => makeHeaders(opts),
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

  const orpcClient: CaredOrpcClient = createORPCClient(link)
  const orpc: CaredOrpcQueryClient = createTanstackQueryUtils(orpcClient)

  return {
    orpcClient,
    orpc,
  }
}

export type CaredOrpcClient = RouterClient<AppRouter>
export type CaredOrpcQueryClient = RouterUtils<CaredOrpcClient>
