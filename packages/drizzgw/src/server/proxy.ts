import type { ParsedGatewayHost } from './host.js'
import { createCaredOrpcClient } from '../cared.js'
import { touchBranchAccess } from '../gateway/access.js'
import { gatewayManager } from '../gateway/manager.js'
import { authorizeBranchAccess } from './auth.js'

/** Hop-by-hop / encoding headers that must not be forwarded after fetch decodes the body. */
const UPSTREAM_RESPONSE_HEADERS_TO_STRIP = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'upgrade',
] as const

function clientResponseHeaders(upstream: Headers): Headers {
  const headers = new Headers(upstream)
  for (const name of UPSTREAM_RESPONSE_HEADERS_TO_STRIP) {
    headers.delete(name)
  }
  return headers
}

/**
 * Proxies an HTTP request to the Drizzle Gateway pod after auth and ensure.
 */
export async function proxyToGateway(host: ParsedGatewayHost, request: Request): Promise<Response> {
  const headers = new Headers(request.headers)
  await authorizeBranchAccess(host, headers)

  const client = createCaredOrpcClient(headers)
  const baseUrl = await gatewayManager.ensureGateway(client, host)
  await touchBranchAccess(host.branchKey)

  const incoming = new URL(request.url)
  const targetUrl = new URL(`${incoming.pathname}${incoming.search}`, baseUrl)

  const upstreamHeaders = new Headers(request.headers)
  upstreamHeaders.delete('host')
  upstreamHeaders.delete('cookie')
  // Let fetch compute length for the streamed body; copied Content-Length causes undici mismatch.
  upstreamHeaders.delete('content-length')
  upstreamHeaders.delete('transfer-encoding')

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers: upstreamHeaders,
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body
    init.duplex = 'half'
  }

  const upstreamResponse = await fetch(targetUrl, init)

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: clientResponseHeaders(upstreamResponse.headers),
  })
}
