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

import type { CaredTrpcRouter } from './api'
import type { CaredClientOptions } from './client'
import { makeHeaders } from './client'

export type CaredTrpcRouterInputs = inferRouterInputs<CaredTrpcRouter>
export type CaredTrpcRouterOutputs = inferRouterOutputs<CaredTrpcRouter>

export type Chat = CaredTrpcRouterOutputs['chat']['byId']['chat']
export type Message = CaredTrpcRouterOutputs['message']['get']['message']

export function createCaredTrpcClient(
  opts: CaredClientOptions & Required<Pick<CaredClientOptions, 'apiUrl'>>,
) {
  const url = opts.apiUrl + '/api/trpc'

  const headers = async () => {
    return makeHeaders(opts)
  }

  return createTRPCClient<CaredTrpcRouter>({
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
