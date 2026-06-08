import { ORPCError, os } from '@orpc/server'

import type { Auth } from './auth'
import type { ResponseHeadersPluginContext } from '@orpc/server/plugins'
import {
  AccountProtectedAuth,
  AdminAuth,
  authenticate,
  ProtectedAuth,
  UserAuth,
  UserPlainAuth,
} from './auth'
import { env } from './env'
import { measure } from './utils'

export interface BaseContext extends ResponseHeadersPluginContext {
  headers: Headers
}

export type Context = BaseContext & {
  auth: Auth
}

export const createORPCContext = async ({ headers }: { headers: Headers }): Promise<Context> => {
  const [execMs, auth] = await measure(authenticate(headers))

  console.log(
    '>>> oRPC Request from',
    headers.get('x-orpc-source') ?? 'unknown',
    'by',
    auth.by(),
    `(${execMs}ms)`,
  )

  return {
    auth,
    headers,
  }
}

const o = os
  .$config({
    // initialOutputValidationIndex: Number.NaN,
  })
  .$context<Context>()

const timingMiddleware = o.middleware(async ({ next, path }) => {
  const [execMs, result] = await measure(async () => {
    // Check if we're in development mode
    const isDev = env.NODE_ENV === 'development'
    if (isDev) {
      // artificial delay in dev 100-500ms
      // const waitMs = Math.floor(Math.random() * 400) + 100
      // await new Promise((resolve) => setTimeout(resolve, waitMs))
    }

    return await next()
  })

  console.log(`[ORPC] ${String(path)} took ${execMs}ms to execute`)

  return result
})

export const publicProcedure = o.use(timingMiddleware)

export type ProtectedContext = BaseContext & {
  auth: ProtectedAuth
}

export const protectedProcedure = o
  .use(timingMiddleware)
  .use<ProtectedContext>(({ context, next }) => {
    if (!context.auth.ctx) {
      throw new ORPCError('UNAUTHORIZED')
    }
    return next({
      context: {
        ...context,
        auth: new ProtectedAuth(context.auth.ctx),
      },
    })
  })

export type UserContext = BaseContext & {
  auth: UserAuth
}

export const userProtectedProcedure = o
  .use(timingMiddleware)
  .use<UserContext>(({ context, next }) => {
    const authCtx = context.auth.ctx
    if (authCtx?.type !== 'user') {
      throw new ORPCError('UNAUTHORIZED')
    }
    return next({
      context: {
        ...context,
        auth: new UserAuth(authCtx),
      },
    })
  })

export type UserPlainContext = BaseContext & {
  auth: UserPlainAuth
}

export const userPlainProtectedProcedure = userProtectedProcedure.use<UserPlainContext>(
  ({ context, next }) => {
    const authCtx = context.auth.ctx
    if (authCtx.policies || authCtx.appId) {
      throw new ORPCError('UNAUTHORIZED')
    }
    return next({
      context: {
        ...context,
        auth: new UserPlainAuth(authCtx),
      },
    })
  },
)

export type AppUserContext = BaseContext & {
  auth: UserAuth & { appId: string }
}

export const appUserProtectedProcedure = o
  .use(timingMiddleware)
  .use<AppUserContext>(({ context, next }) => {
    const authCtx = context.auth.ctx
    if (authCtx?.type !== 'user' || !authCtx.appId) {
      throw new ORPCError('UNAUTHORIZED')
    }
    const auth = new UserAuth(authCtx)
    return next({
      context: {
        ...context,
        auth: Object.assign(auth, { appId: authCtx.appId }),
      },
    })
  })

export type AccountContext = BaseContext & {
  auth: AccountProtectedAuth
}

export const accountProtectedProcedure = o
  .use(timingMiddleware)
  .use<AccountContext>(({ context, next }) => {
    const authCtx = context.auth.ctx
    if (authCtx?.type !== 'account') {
      throw new ORPCError('UNAUTHORIZED')
    }
    return next({
      context: {
        ...context,
        auth: new AccountProtectedAuth(authCtx),
      },
    })
  })

export type AdminContext = BaseContext & {
  auth: AdminAuth
}

export const adminProcedure = o.use(timingMiddleware).use<AdminContext>(({ context, next }) => {
  const authCtx = context.auth.ctx
  if (authCtx?.type !== 'user') {
    throw new ORPCError('UNAUTHORIZED')
  }
  if (!authCtx.isAdmin) {
    throw new ORPCError('FORBIDDEN')
  }
  return next({
    context: {
      ...context,
      auth: new AdminAuth(authCtx),
    },
  })
})
