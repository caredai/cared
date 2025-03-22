import { headers } from 'next/headers'

import { auth } from '@mindworld/auth'

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

      return user
    }),
}
