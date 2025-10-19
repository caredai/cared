import { auth as authApi, headers as authHeaders } from '@cared/auth'
import { eq } from '@cared/db'
import { getDb } from '@cared/db/client'
import { App } from '@cared/db/schema'

import type { ApiKeyAuth } from '../types'
import { getApiKey } from '../operation'
import { getAccessToken } from '../operation/oauth-app'
import { isAdminUser } from '../operation/user'

export type AuthObject =
  | {
      type: 'user'
      userId: string
      isAdmin?: boolean
    }
  | {
      type: 'appUser'
      userId: string
      appId: string
    }
  | ({
      type: 'apiKey'
      ownerId: string
    } & ApiKeyAuth)

export class Auth {
  constructor(public auth?: AuthObject) {}

  type() {
    return this.auth?.type
  }

  isAuthenticated(): boolean {
    return !!this.auth
  }

  isUser(): boolean {
    const auth = this.auth
    return (
      auth?.type === 'user' ||
      auth?.type === 'appUser' ||
      (auth?.type === 'apiKey' && auth.scope === 'user')
    )
  }

  isAdmin(): boolean {
    const auth = this.auth
    return (
      (auth?.type === 'user' && !!auth.isAdmin) ||
      (auth?.type === 'apiKey' && auth.scope === 'user' && !!auth.isAdmin)
    )
  }

  ownerId(): string | undefined {
    const auth = this.auth
    if (auth?.type === 'user' || auth?.type === 'appUser') {
      return auth.userId
    } else if (auth?.type === 'apiKey') {
      return auth.ownerId
    }
  }

  checkOrganization({ organizationId }: { organizationId: string }): boolean {
    const auth = this.auth
    return (
      auth?.type === 'user' ||
      (auth?.type === 'apiKey' &&
        auth.scope === 'organization' &&
        auth.organizationId === organizationId)
    )
  }

  checkWorkspace({
    workspaceId,
    organizationId,
  }: {
    workspaceId: string
    organizationId: string
  }): boolean {
    const auth = this.auth
    if (auth?.type === 'user') {
      return true
    }
    if (auth?.type === 'apiKey') {
      switch (auth.scope) {
        case 'workspace':
          return auth.workspaceId === workspaceId
        case 'organization':
          return auth.organizationId === organizationId
      }
    }
    return false
  }

  checkApp({
    appId,
    workspaceId,
    organizationId,
  }: {
    appId: string
    workspaceId: string
    organizationId: string
  }): boolean {
    const auth = this.auth
    if (auth?.type === 'user') {
      return true
    }
    if (auth?.type === 'apiKey') {
      switch (auth.scope) {
        case 'app':
          return auth.appId === appId
        case 'workspace':
          return auth.workspaceId === workspaceId
        case 'organization':
          return auth.organizationId === organizationId
      }
    }
    return false
  }

  by() {
    const auth = this.auth
    switch (auth?.type) {
      case 'user':
        return `${auth.userId}${auth.isAdmin ? ' (admin)' : ''}`
      case 'appUser':
        return `${auth.appId}:${auth.userId}`
      case 'apiKey':
        switch (auth.scope) {
          case 'user':
            return `${auth.userId}${auth.isAdmin ? ' (admin)' : ''} api key`
          case 'organization':
            return `${auth.organizationId} api key`
          case 'workspace':
            return `${auth.workspaceId} api key`
          case 'app':
            return `${auth.appId} api key`
        }
        break
      default:
        return 'Anonymous'
    }
  }
}

export async function authenticate(headers: Headers): Promise<Auth> {
  const bearerToken = headers.get('Authorization')?.replace('Bearer ', '') ?? ''

  const apiKey = bearerToken.startsWith('sk_') ? bearerToken : headers.get('X-API-KEY')
  if (apiKey) {
    const key = await getApiKey(apiKey)
    if (!key) {
      return new Auth()
    }

    const auth = {
      ...key.metadata,
    } as ApiKeyAuth

    if (auth.scope === 'user') {
      auth.userId = key.userId
      auth.isAdmin = await isAdminUser(auth.userId)
    }

    return new Auth({
      type: 'apiKey',
      ownerId: key.userId,
      ...auth,
    })
  }

  const accessToken = !bearerToken.startsWith('sk_') ? bearerToken : ''
  if (accessToken) {
    const info = await getAccessToken(accessToken)
    if (!info) {
      return new Auth()
    }

    return new Auth({
      type: 'appUser',
      ...info,
    })
  }

  const { user, session } =
    (await authApi.api.getSession({
      headers: authHeaders(headers),
    })) ?? {}
  if (!user || !session) {
    return new Auth()
  }

  {
    const appId = headers.get('X-APP-ID')
    if (appId) {
      const app = await getDb().query.App.findFirst({
        where: eq(App.id, appId),
      })
      if (!app) {
        return new Auth()
      }

      return new Auth({
        type: 'appUser',
        appId,
        userId: session.userId,
      })
    }
  }

  return new Auth({
    type: 'user',
    userId: session.userId,
    isAdmin: user.role === 'admin',
  })
}
