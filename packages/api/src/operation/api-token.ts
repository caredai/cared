import { base64Url } from '@better-auth/utils/base64'
import { createHash } from '@better-auth/utils/hash'

import type { TokenPolicy } from '@cared/shared'
import { generateKey } from '@cared/auth'
import { and, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { ApiToken, User } from '@cared/db/schema'

import { Cache } from './cache'

export async function getApiTokenHash(token: string) {
  // See: https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/plugins/api-key/routes/verify-api-key.ts
  const hash = await createHash('SHA-256').digest(new TextEncoder().encode(token))
  return base64Url.encode(new Uint8Array(hash), {
    padding: false,
  })
}

export async function generateApiToken() {
  const token = generateKey({
    length: 64,
    prefix: 'sk_cr_',
  })
  return {
    token,
    hash: await getApiTokenHash(token),
    start: token.substring(0, 6 + 3),
    end: token.substring(token.length - 3, token.length),
  }
}

export const formatApiToken = (token: ApiToken) => {
  const { metadata, ...properties } = token
  return {
    ...properties,
    start: metadata.start,
    end: metadata.end,
  }
}

const cache = new Cache<
  ApiToken & {
    defaultAccountId: string | null
  }
>('apiToken', async (hash) => ({
  value: await db
    .select({
      apiToken: ApiToken,
      defaultAccountId: User.defaultAccountId,
    })
    .from(ApiToken)
    .leftJoin(User, eq(ApiToken.userId, User.id))
    .where(eq(ApiToken.hash, hash))
    .then((r) => {
      const data = r[0]
      return data && { ...data.apiToken, defaultAccountId: data.defaultAccountId }
    }),
}))

export async function invalidateApiTokenCache(apiTokenHash: string) {
  await cache.invalidate(apiTokenHash)
}

export async function invalidateApiTokensCacheByUser(userId: string) {
  const apiTokenHashes = await db
    .select({ hash: ApiToken.hash })
    .from(ApiToken)
    .where(and(eq(ApiToken.scope, 'user'), eq(ApiToken.userId, userId)))
  await cache.batchInvalidate(...apiTokenHashes.map(({ hash }) => hash))
}

export async function getApiToken(token: string) {
  const hash = await getApiTokenHash(token)
  return await cache.get(hash)
}

export type ApiTokenAuth =
  | {
      scope: 'user'
      userId: string
      accountId: string
      isAdmin?: boolean
      policies: TokenPolicy[]
    }
  | {
      scope: 'account'
      accountId: string
      userId?: string // for `dev.cared.api.ai.${string}.${string}`
      policies: TokenPolicy[]
    }
