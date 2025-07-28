import { cache } from 'react'
import { headers } from 'next/headers'
import { base64Url } from '@better-auth/utils/base64'
import { createHash } from '@better-auth/utils/hash'
import { TRPCError } from '@trpc/server'

import { auth as authApi } from '@cared/auth'
import { eq } from '@cared/db'
import { db } from '@cared/db/client'
import { ApiKey, App, OAuthAccessToken, OAuthApplication, User } from '@cared/db/schema'

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
  return authWithHeaders(await headers())
}

export const authWithHeaders = cache(async (headers: Headers): Promise<Partial<Auth>> => {
  const key = headers.get('X-API-KEY')
  if (key) {
    // See: https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/plugins/api-key/routes/verify-api-key.ts
    const hash = await createHash('SHA-256').digest(new TextEncoder().encode(key))
    const hashed = base64Url.encode(new Uint8Array(hash), {
      padding: false,
    })

    // TODO: cache
    const apiKey = await db.query.ApiKey.findFirst({
      where: eq(ApiKey.key, hashed),
    })

    if (apiKey?.metadata) {
      const appId = JSON.parse(apiKey.metadata).appId! as string

      const userId = headers.get('X-USER-ID')
      if (userId) {
        const user = await db.query.user.findFirst({
          where: eq(User.id, userId),
        })
        if (!user) {
          return {}
        }
        return { appId, userId }
      } else {
        return { appId }
      }
    }
  }

  const authorization = headers.get('Authorization')
  if (authorization) {
    const token = authorization.replace('Bearer ', '')
    // TODO: cache
    const accessToken = await db.query.OAuthAccessToken.findFirst({
      where: eq(OAuthAccessToken.accessToken, token),
    })
    if (accessToken) {
      // TODO: cache
      const oauthApp = await db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.clientId, accessToken.clientId!),
      })
      if (oauthApp?.metadata) {
        const appId = JSON.parse(oauthApp.metadata).appId! as string
        return { appId, userId: accessToken.userId! }
      }
    }
  }

  const { user, session } =
    (await authApi.api.getSession({
      headers,
    })) ?? {}
  if (!user || !session) {
    return {}
  }

  {
    const appId = headers.get('X-APP-ID')
    if (appId) {
      const app = await db.query.App.findFirst({
        where: eq(App.id, appId),
      })
      if (!app) {
        return {}
      }
      return { appId, userId: session.userId }
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
