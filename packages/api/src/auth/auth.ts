import assert from 'assert'
import { ORPCError } from '@orpc/server'

import type { AccountRole, StatementsSubset } from '@cared/auth'
import type { OAuthAppScope, TokenPolicy } from '@cared/shared'
import {
  auth as authApi,
  authHeaders,
  checkPermissionsByOAuthAppScopes,
  checkPermissionsByRole,
  checkPermissionsByTokenPolicies,
} from '@cared/auth'
import { eq } from '@cared/db'
import { db } from '@cared/db/client'
import { OAuthApp } from '@cared/db/schema'

import { getAccessToken, getApiToken, getUserAccounts, isApiTokenCredential } from '../operation'
import { isAdminUser } from '../operation/user'

export type AuthContext =
  | {
      type: 'user'
      userId: string
      accountId: string
      isAdmin?: boolean
      appId?: string // for oauth apps
      scopes?: OAuthAppScope[] // for oauth apps
      policies?: TokenPolicy[] // for user api tokens
    }
  | {
      type: 'account' // for account api tokens
      accountId: string
      userId?: string // `dev.cared.api.account.user`
      policies: TokenPolicy[]
    }

export class Auth {
  constructor(public ctx?: AuthContext) {}

  get type() {
    return this.ctx?.type
  }

  get isAuthenticated(): boolean {
    return !!this.ctx
  }

  get isUser(): boolean {
    return this.ctx?.type === 'user'
  }

  get isAdmin() {
    const auth = this.ctx
    return auth?.type === 'user' && auth.isAdmin === true
  }

  by() {
    const auth = this.ctx
    switch (auth?.type) {
      case 'user': {
        let label = `${auth.userId}${auth.isAdmin ? ' (admin)' : ''}`
        if (auth.policies !== undefined) {
          label += ' api token'
        }
        if (auth.appId) {
          label += ` (${auth.appId})`
        }
        return label
      }
      case 'account':
        return `${auth.accountId} api token`
    }
    return 'Anonymous'
  }

  async requirePermissions(
    permissions: StatementsSubset | undefined = undefined,
    checkFields: {
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

    // check account id
    if (checkFields.accountId && checkFields.accountId !== auth.accountId) {
      throwError()
    }
    // check user id
    if (checkFields.userId && checkFields.userId !== auth.userId) {
      throwError()
    }

    if (auth.type === 'account') {
      // account api token
      const success = checkPermissionsByTokenPolicies({
        permissions,
        policies: auth.policies,
        accountId: auth.accountId,
        userId: auth.userId,
      })
      if (!success) {
        throwError()
      }
    } else {
      const userAccount = await getUserAccount(auth.userId, auth.accountId)

      // check role of user in account
      if (checkFields.roles && !checkFields.roles.includes(userAccount.role)) {
        throwError()
      }

      if (auth.policies) {
        // user api token
        const success = checkPermissionsByTokenPolicies({
          permissions,
          policies: auth.policies,
          userId: auth.userId,
          accountId: auth.accountId,
          role: userAccount.role,
        })
        if (!success) {
          throwError()
        }
      } else if (auth.scopes) {
        // oauth app access token
        const success = checkPermissionsByOAuthAppScopes({
          permissions,
          scopes: auth.scopes,
          role: userAccount.role,
        })
        if (!success) {
          throwError()
        }
      } else {
        // session user
        const success = checkPermissionsByRole(userAccount.role, permissions)
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

  const apiToken =
    bearerToken && isApiTokenCredential(bearerToken)
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

    if (key.credentialType === 'user') {
      const userId = key.userId!
      return new Auth({
        type: 'user',
        userId,
        accountId: headers.get('X-ACCOUNT-ID') ?? key.defaultAccountId!,
        isAdmin: await isAdminUser(userId),
        policies: key.policies,
      })
    } else {
      return new Auth({
        type: 'account',
        accountId: key.accountId!,
        userId: key.userId ?? undefined,
        policies: key.policies,
      })
    }
  }

  const accessToken = bearerToken && !isApiTokenCredential(bearerToken) ? bearerToken : undefined
  if (accessToken) {
    const info = await getAccessToken(accessToken)
    if (!info) {
      return new Auth()
    }

    return new Auth({
      type: 'user',
      userId: info.userId,
      accountId: info.accountId,
      appId: info.appId,
      scopes: info.scopes,
    })
  }

  const { user, session } =
    (await authApi.api.getSession({
      headers: authHeaders(headers),
    })) ?? {}
  if (!user?.defaultAccountId || !session) {
    return new Auth()
  }

  const accountId = headers.get('X-ACCOUNT-ID') ?? session.activeAccountId ?? user.defaultAccountId

  {
    const appId = headers.get('X-APP-ID')
    if (appId) {
      const app = await db.query.OAuthApp.findFirst({
        where: eq(OAuthApp.id, appId),
      })
      if (!app) {
        return new Auth()
      }

      return new Auth({
        type: 'user',
        userId: session.userId,
        accountId,
        appId: app.id,
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
  userId?: string

  constructor(public ctx: AuthContext) {
    super(ctx)
    this.accountId = ctx.accountId
    this.userId = ctx.userId
  }

  static async authenticate(headers: Headers) {
    const auth = await authenticate(headers)
    if (!auth.ctx) {
      return
    }
    return new ProtectedAuth(auth.ctx)
  }
}

export class AccountProtectedAuth extends ProtectedAuth {
  get type() {
    return 'account' as const
  }

  constructor(public ctx: Extract<AuthContext, { type: 'account' }>) {
    super(ctx)
  }
}

export class UserAuth extends ProtectedAuth {
  get type() {
    return 'user' as const
  }
  userId: string
  appId?: string

  constructor(public ctx: Extract<AuthContext, { type: 'user' }>) {
    super(ctx)
    this.userId = ctx.userId
    this.appId = ctx.appId
  }
}

export class UserPlainAuth extends UserAuth {
  constructor(public ctx: Extract<AuthContext, { type: 'user' }>) {
    super(ctx)
    assert(ctx.policies === undefined)
  }
}

export class AdminAuth extends UserAuth {
  constructor(public ctx: Extract<AuthContext, { type: 'user' }>) {
    super(ctx)
    assert(ctx.isAdmin)
  }
}
