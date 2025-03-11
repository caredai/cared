import { cache } from 'react'
import { headers } from 'next/headers'
import { auth as clerkAuth } from '@clerk/nextjs/server'

import type { App } from '@mindworld/db/schema'
import { eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { OAuthApp } from '@mindworld/db/schema'

import { env } from '@/env'
import { getClerkOAuthApp } from './router/oauth-app'

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
  // for oauth app user auth
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

export const authForApi = cache(async (): Promise<Auth | Response> => {
  const h = await headers()
  const authType = h.get('X-AUTH-TYPE')
  const [authScheme, token] = (h.get('Authorization') ?? '').split(' ')
  if (authScheme === 'Bearer' && token) {
    const clientId = h.get('X-OAUTH-CLIENT-ID')
    if (authType?.toUpperCase() === 'APP') {
      // TODO: get app by api key
      const app: App | undefined = {} as App
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!app) {
        return new Response('Unauthorized', { status: 401 })
      }
      return {
        appId: app.id,
      }
    } else if (authType?.toUpperCase() === 'USER' && clientId) {
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

  const { userId, orgId, orgRole } = await clerkAuth()
  if (userId) {
    const isAdmin = orgId === env.CLERK_ADMIN_ORGANIZATION_ID && orgRole === 'org:admin'
    return !isAdmin
      ? {
          userId,
        }
      : {
          userId,
          isAdmin,
        }
  }

  return new Response('Unauthorized', { status: 401 })
})

export async function auth(): Promise<Auth> {
  return (await authForApi()) as Auth
}

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
