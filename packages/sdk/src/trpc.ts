import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import {
  createTRPCClient,
  httpBatchStreamLink,
  httpLink,
  isNonJsonSerializable,
  loggerLink,
  splitLink,
} from '@trpc/client'
import SuperJSON from 'superjson'

import type { OwnxTrpcRouter } from './api'
import type { OwnxClientOptions } from './client'
import { makeHeaders } from './client'

export type OwnxTrpcRouterInputs = inferRouterInputs<OwnxTrpcRouter>
export type OwnxTrpcRouterOutputs = inferRouterOutputs<OwnxTrpcRouter>

export type Chat = OwnxTrpcRouterOutputs['chat']['byId']['chat']
export type Message = OwnxTrpcRouterOutputs['message']['get']['message']

export function createOwnxTrpcClient(
  opts: OwnxClientOptions & Required<Pick<OwnxClientOptions, 'apiUrl'>>,
) {
  const url = opts.apiUrl + '/api/trpc'

  const headers = async () => {
    return makeHeaders(opts)
  }

  return createTRPCClient<OwnxTrpcRouter>({
    links: [
      loggerLink({
        enabled: (op) =>
          process.env.NODE_ENV === 'development' ||
          (op.direction === 'down' && op.result instanceof Error),
      }),
      splitLink({
        condition: (op) => isNonJsonSerializable(op.input),
        true: httpLink({
          // @ts-ignore
          transformer: undefined,
          url,
          headers,
        }),
        false: httpBatchStreamLink({
          transformer: SuperJSON,
          url,
          headers,
        }),
      }),
    ],
  })
}
