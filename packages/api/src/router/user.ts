import { headers } from 'next/headers'
import { TRPCError } from '@trpc/server'

import { auth } from '@mindworld/auth'
import { eq } from '@mindworld/db'
import { Account } from '@mindworld/db/schema'

import { userProtectedProcedure } from '../trpc'

export const userRouter = {
  me: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/me',
        protect: true,
        tags: ['me'],
        summary: 'Get current user information',
      },
    })
    .query(async ({ ctx }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This api is only available for authenticated users',
        })
      }

      const { user } = (await auth.api.getSession({
        headers: await headers(),
      }))!

      return {
        user,
      }
    }),

  accounts: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/me/accounts',
        protect: true,
        tags: ['me'],
        summary: 'Get linked accounts of current user',
      },
    })
    .query(async ({ ctx }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This api is only available for authenticated users',
        })
      }

      const accounts = await ctx.db.query.Account.findMany({
        where: eq(Account.userId, ctx.auth.userId),
      })

      return { accounts }
    }),

  session: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/me/session',
        protect: true,
        tags: ['me'],
        summary: 'Get current session of current user',
      },
    })
    .query(async ({ ctx }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This api is only available for authenticated users',
        })
      }

      const { user, session } = (await auth.api.getSession({
        headers: await headers(),
      }))!

      return { user, session }
    }),

  sessions: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/me/sessions',
        protect: true,
        tags: ['me'],
        summary: 'Get sessions of current user',
      },
    })
    .query(async ({ ctx }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This api is only available for authenticated users',
        })
      }

      const sessions = (await auth.api.customListSessions({
        headers: await headers(),
      })) as (typeof auth.$Infer.Session)['session'][]

      return {
        sessions: sessions.map((session) => ({
          ...session,
          geolocation: session.geolocation
            ? (JSON.parse(session.geolocation) as {
                city?: string
                region?: string
                country?: string
              })
            : undefined,
        })),
      }
    }),
}
