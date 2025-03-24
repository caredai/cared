import { cache } from 'react'
import { headers } from 'next/headers'
import { TRPCError } from '@trpc/server'

import { auth as authApi } from '@mindworld/auth'
import { eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { ApiKey, OAuthAccessToken, OAuthApplication } from '@mindworld/db/schema'

export type Auth =
  // for user auth
  | {
      userId: string
      isAdmin?: never
      appId?: never
    }
  // for admin user auth
  | {
      userId: string
      isAdmin: true
      appId?: never
    }
  // for app user auth
  | {
      userId: string
      isAdmin?: never
      appId: string
    }
  // for app api key auth
  | {
      userId?: never
      isAdmin?: never
      appId: string
    }

export async function auth() {
  return authenticate(await headers())
}

export const authenticate = cache(async (headers: Headers): Promise<Auth> => {
  // real authentication logic is here
  const { user, session } =
    (await authApi.api.getSession({
      headers,
    })) ?? {}
  if (!user || !session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
    })
  }

  const apiKey = await db.query.ApiKey.findFirst({
    where: eq(ApiKey.id, session.userId),
  })
  if (apiKey?.metadata) {
    const appId = JSON.parse(apiKey.metadata).appId! as string
    return { appId }
  }

  const authorization = headers.get('authorization')
  if (authorization) {
    const token = authorization.replace('Bearer ', '')
    const accessToken = await db.query.OAuthAccessToken.findFirst({
      where: eq(OAuthAccessToken.accessToken, token),
    })
    await authApi.api.oAuth2userInfo({})
    if (accessToken) {
      const oauthApp = await db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.clientId, accessToken.clientId!),
      })
      if (oauthApp?.metadata) {
        const appId = JSON.parse(oauthApp.metadata).appId! as string
        return { appId, userId: session.userId }
      }
    }
  }

  return user.role === 'admin'
    ? { userId: session.userId, isAdmin: true }
    : { userId: session.userId }
})

export function checkAppUser(auth: Auth, appId: string) {
  if (!auth.userId) {
    return
  }
  if (auth.appId && auth.appId !== appId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Accessing the app is not authorized by the user',
    })
  }
}
