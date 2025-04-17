import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCClient, loggerLink, unstable_httpBatchStreamLink } from '@trpc/client'
import SuperJSON from 'superjson'

import type { OwnxTrpcRouter } from './api'
import { makeHeaders, OwnxClientOptions } from './client'

export type * from './api'

export type OwnxTrpcRouterInputs = inferRouterInputs<OwnxTrpcRouter>
export type OwnxTrpcRouterOutputs = inferRouterOutputs<OwnxTrpcRouter>

export type Chat = OwnxTrpcRouterOutputs['chat']['byId']['chat']

export function createOwnxTrpcClient(
  opts: OwnxClientOptions & Required<Pick<OwnxClientOptions, 'apiUrl'>>,
) {
  return createTRPCClient<OwnxTrpcRouter>({
    links: [
      loggerLink({
        enabled: (op) =>
          process.env.NODE_ENV === 'development' ||
          (op.direction === 'down' && op.result instanceof Error),
      }),
      unstable_httpBatchStreamLink({
        transformer: SuperJSON,

        url: opts.apiUrl + '/api/trpc',
        async headers() {
          return makeHeaders(opts)
        },
      }),
    ],
  })
}
