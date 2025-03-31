import { headers } from 'next/headers'
import { auth } from '@tavern/auth'

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
    .query(async () => {
      const { user } = (await auth.api.getSession({
        headers: await headers(),
      }))!

      return {
        user,
      }
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
    .query(async () => {
      const { user, session } = (await auth.api.getSession({
        headers: await headers(),
      }))!

      return { user, session }
    }),
}
