import { eq } from '@cared/db'
import { getDb } from '@cared/db/client'
import { OAuthAccessToken, OAuthApplication } from '@cared/db/schema'

import { Cache } from './cache'

const cache = new Cache<{
  userId: string
  appId: string
}>(
  'oauthAccessToken',
  async (accessToken) => {
    const data = (
      await getDb()
        .select({
          userId: OAuthAccessToken.userId,
          accessTokenExpiresAt: OAuthAccessToken.accessTokenExpiresAt,
          metadata: OAuthApplication.metadata,
        })
        .from(OAuthAccessToken)
        .innerJoin(OAuthApplication, eq(OAuthAccessToken.clientId, OAuthApplication.clientId))
        .where(eq(OAuthAccessToken.accessToken, accessToken))
        .limit(1)
    ).at(0)

    if (!data?.userId || !data.accessTokenExpiresAt || !data.metadata) {
      return
    }

    const parsedMetadata = JSON.parse(data.metadata) as { appId?: string }
    const appId = parsedMetadata.appId
    if (!appId) {
      return
    }

    return {
      value: {
        appId,
        userId: data.userId,
      },
      ttl: data.accessTokenExpiresAt,
    }
  },
  undefined,
)

export async function getAccessToken(accessToken: string) {
  return await cache.get(accessToken)
}
