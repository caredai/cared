import { base64Url } from '@better-auth/utils/base64'
import { createHash } from '@better-auth/utils/hash'
import { ORPCError } from '@orpc/server'

import { OAUTH_CLIENT_SECRET_PREFIX, resolveOAuthAppScopes } from '@cared/auth'
import type { OAuthAppScope } from '@cared/shared'
import { eq, or } from '@cared/db'
import { db } from '@cared/db/client'
import { OAuthAccessToken, OAuthApp, User } from '@cared/db/schema'
import { stripIdPrefix } from '@cared/shared'

import { Cache } from './cache'

/** Non-sensitive hints for displaying a client secret (same pattern as generateApiToken). */
export function clientSecretHintsFrom(secret: string) {
  const prefix = OAUTH_CLIENT_SECRET_PREFIX
  return {
    start: secret.substring(0, prefix.length + 3),
    end: secret.substring(secret.length - 3, secret.length),
  }
}

const authHasher = async (value: string) => {
  const hash = await createHash('SHA-256').digest(new TextEncoder().encode(value))
  const hashed = base64Url.encode(new Uint8Array(hash), {
    padding: false,
  })
  return hashed
}

const cache = new Cache<{
  userId: string
  accountId: string
  appId: string
  scopes: OAuthAppScope[]
}>(
  'oauthAccessToken',
  async (accessToken) => {
    const data = (
      await db
        .select({
          userId: OAuthAccessToken.userId,
          defaultAccountId: User.defaultAccountId,
          expiresAt: OAuthAccessToken.expiresAt,
          appId: OAuthApp.id,
          accountId: OAuthAccessToken.referenceId,
          scopes: OAuthAccessToken.scopes,
        })
        .from(OAuthAccessToken)
        .innerJoin(
          OAuthApp,
          or(
            eq(OAuthAccessToken.clientId, OAuthApp.clientId),
            eq(OAuthAccessToken.clientId, OAuthApp.publicClientId),
          ),
        )
        .innerJoin(User, eq(OAuthAccessToken.userId, User.id))
        .where(eq(OAuthAccessToken.token, await authHasher(stripIdPrefix(accessToken))))
        .limit(1)
    ).at(0)

    if (!data?.userId || !data.defaultAccountId || !data.appId) {
      return
    }

    return {
      value: {
        userId: data.userId,
        // Prefer account selected during OAuth consent over default account.
        accountId: data.accountId ?? data.defaultAccountId,
        appId: data.appId,
        scopes: resolveOAuthAppScopes(data.scopes),
      },
      ttl: data.expiresAt,
    }
  },
  undefined,
)

export async function getAccessToken(accessToken: string) {
  return await cache.get(accessToken)
}

export async function invalidateAccessTokensCache(...accessTokens: string[]) {
  return await cache.batchInvalidate(...accessTokens)
}

/** Resolve OAuth app by either confidential or public client_id. */
export async function getOAuthAppByClientId(clientId: string) {
  return await db.query.OAuthApp.findFirst({
    where: or(eq(OAuthApp.clientId, clientId), eq(OAuthApp.publicClientId, clientId)),
  })
}

/** Get an OAuth app by primary key id. */
export async function getOAuthAppById(id: string) {
  const app = await db.query.OAuthApp.findFirst({
    where: eq(OAuthApp.id, id),
  })

  if (!app) {
    throw new ORPCError('NOT_FOUND', {
      message: `OAuth app with id ${id} not found`,
    })
  }

  return app
}
