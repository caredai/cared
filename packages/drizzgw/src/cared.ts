import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'

import type { CaredOrpcClient } from '@cared/sdk'

import { env } from './env.js'

export type { CaredOrpcClient }

/**
 * Auth headers for Cared ORPC. Inbound requests (e.g. POST /_cared/sync with no body)
 * may carry Content-Length: 0; forwarding those breaks ORPC JSON calls under undici.
 */
export function caredRequestHeaders(incoming: Headers): Headers {
  const out = new Headers()
  const cookie = incoming.get('cookie')
  if (cookie) {
    out.set('cookie', cookie)
  }
  const authorization = incoming.get('authorization')
  if (authorization) {
    out.set('authorization', authorization)
  }
  return out
}

export function createCaredOrpcClient(incomingHeaders: Headers): CaredOrpcClient {
  const headers = caredRequestHeaders(incomingHeaders)
  const link = new RPCLink({
    url: new URL(env.CARED_API_URL).origin + '/rpc',
    headers: () => headers,
    fetch: (request, init) =>
      globalThis.fetch(request, {
        ...init,
        credentials: 'include',
      }),
  })

  return createORPCClient(link)
}
