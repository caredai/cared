import { headers } from 'next/headers'

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
        tags: ['users'],
        summary: 'Get current user information',
      },
    })
    .query(async () => {
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
        tags: ['users'],
        summary: 'Get linked accounts of current user',
      },
    })
    .query(async ({ ctx }) => {
      const accounts = await ctx.db.query.Account.findMany({
        where: eq(Account.userId, ctx.auth.userId),
      })

      return { accounts }
    }),
}
