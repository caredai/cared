import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCClient, httpBatchStreamLink, loggerLink } from '@trpc/client'
import SuperJSON from 'superjson'

import type { OwnxTrpcRouter } from './api'
import { makeHeaders, OwnxClientOptions } from './client'

export type OwnxTrpcRouterInputs = inferRouterInputs<OwnxTrpcRouter>
export type OwnxTrpcRouterOutputs = inferRouterOutputs<OwnxTrpcRouter>

export type Chat = OwnxTrpcRouterOutputs['chat']['byId']['chat']
export type Message = OwnxTrpcRouterOutputs['message']['get']['message']

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
      httpBatchStreamLink({
        transformer: SuperJSON,

        url: opts.apiUrl + '/api/trpc',
        async headers() {
          return makeHeaders(opts)
        },
      }),
    ],
  })
}
