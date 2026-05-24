import { createHash } from 'node:crypto'

import type { ParsedGatewayHost } from './host.js'
import { createCaredOrpcClient } from '../cared.js'
import { authCacheKey, getRedis } from '../redis.js'

/** Buffer before session expiry so cached auth does not outlive the session. */
const AUTH_CACHE_EXPIRY_MARGIN_SECONDS = 30

function cookieForCache(headers: Headers): string {
  const cookie = headers.get('cookie')
  if (!cookie) {
    throw new Error('Cookie header is required for gateway authorization')
  }
  return cookie
}

function cacheDigest(host: ParsedGatewayHost, headers: Headers) {
  return createHash('sha256')
    .update(`${host.namespaceIdNoPrefix}:${host.branchId}\n${cookieForCache(headers)}`)
    .digest('hex')
}

function authCacheTtlSeconds(expiresAt: Date | string): number {
  const ttlSeconds = Math.floor(
    (new Date(expiresAt).getTime() - Date.now()) / 1000 - AUTH_CACHE_EXPIRY_MARGIN_SECONDS,
  )
  return Math.max(1, ttlSeconds)
}

/**
 * Verifies the caller can access the branch via Cared API (cached per host + cookies).
 */
export async function authorizeBranchAccess(
  host: ParsedGatewayHost,
  headers: Headers,
): Promise<void> {
  const digest = cacheDigest(host, headers)
  const redis = await getRedis()
  const cached = await redis.get(authCacheKey(digest))
  if (cached === '1') {
    return
  }

  const client = createCaredOrpcClient(headers)
  const [, session] = await Promise.all([
    client.account.database.getBranch({
      namespaceId: host.namespaceId,
      branchId: host.branchId,
    }),
    client.user.session(),
  ])

  const expiresAt = session?.session.expiresAt
  if (!expiresAt) {
    throw new Error('Expected session with expiresAt after branch authorization')
  }

  const ttlSeconds = authCacheTtlSeconds(expiresAt)
  await redis.set(authCacheKey(digest), '1', { EX: ttlSeconds })
}
