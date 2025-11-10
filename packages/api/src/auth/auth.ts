import assert from 'assert'
import { ORPCError } from '@orpc/server'

import type { AccountRole, StatementsSubset } from '@cared/auth'
import {
  auth as authApi,
  authHeaders,
  checkPermissionsByRole,
  checkTokenPolicies,
} from '@cared/auth'
import { eq } from '@cared/db'
import { db } from '@cared/db/client'
import { App } from '@cared/db/schema'

import type { ApiTokenAuth } from '../operation'
import { getApiToken, getUserAccounts } from '../operation'
import { getAccessToken } from '../operation/oauth-app'
import { isAdminUser } from '../operation/user'

export type AuthContext =
  | {
      type: 'user'
      userId: string
      accountId: string
      isAdmin?: boolean
    }
  | {
      type: 'appUser'
      userId: string
      accountId: string
      appId: string
    }
  | ({
      type: 'apiToken'
    } & ApiTokenAuth)

export class Auth {
  constructor(public ctx?: AuthContext) {}

  isAuthenticated(): boolean {
    return !!this.ctx
  }

  get isUser(): boolean {
    const auth = this.ctx
    return (
      auth?.type === 'user' ||
      auth?.type === 'appUser' ||
      (auth?.type === 'apiToken' && auth.scope === 'user')
    )
  }

  get isAdmin() {
    const auth = this.ctx
    return (
      (auth?.type === 'user' || (auth?.type === 'apiToken' && auth.scope === 'user')) &&
      auth.isAdmin === true
    )
  }

  by() {
    const auth = this.ctx
    switch (auth?.type) {
      case 'user':
        return `${auth.userId}${auth.isAdmin ? ' (admin)' : ''}`
      case 'appUser':
        return `${auth.appId}:${auth.userId}`
      case 'apiToken':
        switch (auth.scope) {
          case 'user':
            return `${auth.userId}${auth.isAdmin ? ' (admin)' : ''} api key`
          case 'account':
            return `${auth.accountId} api key`
        }
        break
    }
    return 'Anonymous'
  }

  async requirePermissions(
    permissions: StatementsSubset | undefined = undefined,
    {
      accountId,
      userId,
      roles,
    }: {
      accountId?: string | null
      userId?: string | null
      roles?: AccountRole[]
    } = {},
  ) {
    const auth = this.ctx
    if (!auth) {
      throw new ORPCError('UNAUTHORIZED')
    }

    const throwError = () => {
      throw new ORPCError('FORBIDDEN', {
        message: 'You do not have permission to perform this action',
      })
    }

    if (accountId && accountId !== auth.accountId) {
      throwError()
      return
    }
    if (userId && (!('userId' in auth) || userId !== auth.userId)) {
      throwError()
    }

    if (auth.type === 'apiToken' && auth.scope === 'account') {
      const success = checkTokenPolicies({
        permissions,
        policies: auth.policies,
        accountId: auth.accountId,
        userId: auth.userId,
      })
      if (!success) {
        throwError()
      }
    } else {
      const account = await getUserAccount(auth.userId, auth.accountId)

      if (roles && !roles.includes(account.role)) {
        throwError()
      }

      if (auth.type === 'apiToken') {
        const success = checkTokenPolicies({
          permissions,
          policies: auth.policies,
          userId: auth.userId,
          accountId: auth.accountId,
          role: account.role,
        })
        if (!success) {
          throwError()
        }
      } else {
        const success = checkPermissionsByRole(account.role, permissions ?? { pseudo: [] })
        if (!success) {
          throwError()
        }
      }
    }
  }
}

async function getUserAccount(userId: string, accountId: string) {
  let accounts = await getUserAccounts(userId)
  let account = accounts.find(({ id }) => id === accountId)
  if (!account) {
    // Force fetch
    accounts = await getUserAccounts(userId, true)
    account = accounts.find(({ id }) => id === accountId)
  }
  if (!account) {
    throw new ORPCError('UNAUTHORIZED')
  }
  return account
}

export async function authenticate(headers: Headers): Promise<Auth> {
  const bearerToken = headers.get('Authorization')?.replace('Bearer ', '') ?? ''

  const apiToken = bearerToken.startsWith('sk_cr_')
    ? bearerToken
    : (headers.get('X-API-TOKEN') ?? headers.get('X-API-KEY'))

  if (apiToken) {
    const key = await getApiToken(apiToken)
    if (!key) {
      return new Auth()
    }

    if (
      !key.enabled ||
      (key.notBefore && key.notBefore.getTime() > Date.now()) ||
      (key.expiresAt && key.expiresAt.getTime() < Date.now())
    ) {
      throw new ORPCError('UNAUTHORIZED')
    }

    const auth: ApiTokenAuth =
      key.scope === 'user'
        ? {
            scope: 'user',
            userId: key.userId!,
            accountId: headers.get('X-ACCOUNT-ID') ?? key.defaultAccountId!,
            isAdmin: await isAdminUser(key.userId!),
            policies: key.policies,
          }
        : {
            scope: 'account',
            accountId: key.accountId!,
            userId: key.userId ?? undefined,
            policies: key.policies,
          }

    return new Auth({
      type: 'apiToken',
      ...auth,
    })
  }

  const accessToken = !bearerToken.startsWith('sk_cr_') && bearerToken
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
  if (!user?.defaultAccountId || !session) {
    return new Auth()
  }

  const accountId =
    headers.get('X-ACCOUNT-ID') ?? session.activeOrganizationId ?? user.defaultAccountId

  {
    const appId = headers.get('X-APP-ID')
    if (appId) {
      const app = await db.query.App.findFirst({
        where: eq(App.id, appId),
      })
      if (!app) {
        return new Auth()
      }

      return new Auth({
        type: 'appUser',
        userId: session.userId,
        accountId,
        appId,
      })
    }
  }

  return new Auth({
    type: 'user',
    userId: session.userId,
    accountId,
    isAdmin: user.role === 'admin',
  })
}

export class ProtectedAuth extends Auth {
  accountId: string

  constructor(public ctx: AuthContext) {
    super(ctx)
    this.accountId = ctx.accountId
  }

  static async authenticate(headers: Headers) {
    const auth = await authenticate(headers)
    if (!auth.ctx) {
      return
    }
    return new ProtectedAuth(auth.ctx)
  }
}

export class UserAuth extends ProtectedAuth {
  type: 'user' | 'apiToken'
  userId: string

  constructor(
    public ctx: Extract<AuthContext, { type: 'user' } | { type: 'apiToken'; scope: 'user' }>,
  ) {
    super(ctx)
    this.type = ctx.type
    this.userId = ctx.userId
  }
}

export class UserPlainAuth extends UserAuth {
  type: 'user'

  constructor(public ctx: Extract<AuthContext, { type: 'user' }>) {
    super(ctx)
    this.type = ctx.type
  }
}

export class AppUserAuth extends ProtectedAuth {
  userId: string
  appId: string

  constructor(public ctx: Extract<AuthContext, { type: 'appUser' }>) {
    super(ctx)
    this.userId = ctx.userId
    this.appId = ctx.appId
  }
}

export class UserOrAppUserAuth extends ProtectedAuth {
  type: 'user' | 'appUser'
  userId: string
  appId?: string

  constructor(public ctx: Extract<AuthContext, { type: 'user' | 'appUser' }>) {
    super(ctx)
    this.type = ctx.type
    this.userId = ctx.userId
    if (ctx.type === 'appUser') {
      this.appId = ctx.appId
    }
  }
}

export class AdminAuth extends UserAuth {
  constructor(
    public ctx: Extract<AuthContext, { type: 'user' } | { type: 'apiToken'; scope: 'user' }>,
  ) {
    super(ctx)
    assert(ctx.isAdmin)
  }
}
