import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCClient, loggerLink, unstable_httpBatchStreamLink } from '@trpc/client'
import SuperJSON from 'superjson'

import type { OwnxTrpcRouter } from './api'
import { env } from './env'

export type * from './api'

export type OwnxTrpcRouterInputs = inferRouterInputs<OwnxTrpcRouter>
export type OwnxTrpcRouterOutputs = inferRouterOutputs<OwnxTrpcRouter>

export function createOwnxTrpcClient(
  opts:
    | {
        apiKey: string
      }
    | {
        userToken: string | (() => string | Promise<string>) // user access token
      },
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

        url: env.OWNX_API_URL
          ? new URL(env.OWNX_API_URL).origin + '/api/trpc'
          : 'https://ownx.ai/api/trpc',
        async headers() {
          return makeHeaders(opts)
        },
      }),
    ],
  })
}

export function createOwnxTrpcClientWithApiKey(apiKey: string) {
  return createOwnxTrpcClient({ apiKey })
}

export function createOwnxTrpcClientWithUserToken(
  userToken: string | (() => string | Promise<string>),
) {
  return createOwnxTrpcClient({ userToken })
}

export async function makeHeaders(
  opts:
    | {
        apiKey: string
      }
    | {
        userToken: string | (() => string | Promise<string>) // user access token
      },
) {
  const headers = new Headers()
  const apiKey = (opts as { apiKey?: string }).apiKey
  if (apiKey) {
    headers.set('X-API-KEY', apiKey)
  } else {
    opts = opts as {
      userToken: string | (() => string | Promise<string>)
    }
    const userToken = typeof opts.userToken === 'string' ? opts.userToken : await opts.userToken()
    headers.set('Authorization', 'Bearer ' + userToken)
  }
  return headers
}
