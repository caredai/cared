import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCClient, loggerLink, unstable_httpBatchStreamLink } from '@trpc/client'
import SuperJSON from 'superjson'

import type { API } from '../types/api'

export { API }
export type RouterInputs = inferRouterInputs<API>
export type RouterOutputs = inferRouterOutputs<API>

export function createTrpcClient(
  opts:
    | {
        apiKey: string
      }
    | {
        userToken: string | (() => string | Promise<string>) // user access token
        appId: string
      },
) {
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
        async headers() {
          const headers = new Headers()
          const apiKey = (opts as { apiKey?: string }).apiKey
          if (apiKey) {
            headers.set('Authorization', 'Bearer ' + apiKey)
            headers.set('X-AUTH-TYPE', 'API-KEY') // optional
          } else {
            opts = opts as {
              userToken: string | (() => string | Promise<string>)
              appId: string
            }
            const userToken =
              typeof opts.userToken === 'string' ? opts.userToken : await opts.userToken()
            headers.set('Authorization', 'Bearer ' + userToken)
            headers.set('X-APP-ID', opts.appId)
            headers.set('X-AUTH-TYPE', 'OAUTH')
          }
          return headers
        },
      }),
    ],
  })
}
