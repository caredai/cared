import { eq } from '@cared/db'
import { db } from '@cared/db/client'
import { OAuthAccessToken, OAuthApplication, User } from '@cared/db/schema'

import { Cache } from './cache'

const cache = new Cache<{
  userId: string
  accountId: string
  appId: string
}>(
  'oauthAccessToken',
  async (accessToken) => {
    const data = (
      await db
        .select({
          userId: OAuthAccessToken.userId,
          defaultAccountId: User.defaultAccountId,
          accessTokenExpiresAt: OAuthAccessToken.accessTokenExpiresAt,
          metadata: OAuthApplication.metadata,
        })
        .from(OAuthAccessToken)
        .innerJoin(OAuthApplication, eq(OAuthAccessToken.clientId, OAuthApplication.clientId))
        .innerJoin(User, eq(OAuthAccessToken.userId, User.id))
        .where(eq(OAuthAccessToken.accessToken, accessToken))
        .limit(1)
    ).at(0)

    if (!data?.userId || !data.defaultAccountId || !data.accessTokenExpiresAt || !data.metadata) {
      return
    }

    const parsedMetadata = JSON.parse(data.metadata) as { appId?: string }
    const appId = parsedMetadata.appId
    if (!appId) {
      return
    }

    return {
      value: {
        userId: data.userId,
        // TODO: select account upon odic login or in app
        accountId: data.defaultAccountId,
        appId,
      },
      ttl: data.accessTokenExpiresAt,
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
