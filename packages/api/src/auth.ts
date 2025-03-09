import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

import type { App } from '@mindworld/db/schema'
import { eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { OAuthApp } from '@mindworld/db/schema'

import { getClerkOAuthApp } from './router/oauth-app'

// userId: for user auth
// userId & orgId & orgRole: for admin user auth
// userId & appId: for oauth app user auth
// appId: for app api key auth
export interface Auth {
  userId?: string
  appId?: string
  orgId?: string
  orgRole?: string
}

export const authenticateForApi = cache(async (): Promise<Auth | Response> => {
  const h = await headers()
  const [type, token] = (h.get('Authorization') ?? '').split(' ')
  if (type === 'Bearer' && token) {
    const clientId = h.get('X-OAUTH-CLIENT-ID')
    if (!clientId) {
      // TODO: get app by api key
      const app: App | undefined = {} as App
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!app) {
        return new Response('Unauthorized', { status: 401 })
      }
      return {
        appId: app.id,
      }
    } else {
      const app = await db.query.OAuthApp.findFirst({
        where: eq(OAuthApp.clientId, clientId),
      })
      if (!app) {
        return new Response('Unauthorized', { status: 401 })
      }
      const oauthApp = await getClerkOAuthApp(app.oauthAppId)
      if (!oauthApp?.clientSecret) {
        return new Response('Unauthorized', { status: 401 })
      }
      // Introspect token
      // NOTE: cannot use bearer auth here
      // See: https://github.com/ory/fosite/blob/master/introspection_request_handler.go
      const r = await fetch('', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // basic auth
          Authorization: `Basic ${Buffer.from(`${clientId}:${oauthApp.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          token,
        }),
      })
      if (!r.ok) {
        return new Response('Unauthorized', { status: 401 })
      }
      const info = (await r.json()) as TokenInfo
      if (!info.active) {
        return new Response('Unauthorized', { status: 401 })
      }
      return {
        userId: info.sub,
        appId: app.appId,
      }
    }
  }

  const { userId, orgId, orgRole } = await auth()
  if (userId) {
    return {
      userId,
      orgId,
      orgRole,
    }
  }

  return new Response('Unauthorized', { status: 401 })
})

type TokenInfo =
  | {
      active: false
    }
  | {
      active: true
      client_id: string
      iat: number
      scope: string
      sub: string // user id
    }
