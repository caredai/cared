import { currentUser } from '@clerk/nextjs/server'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'

import { User } from '@mindworld/db/schema'

import { protectedProcedure } from '../trpc'

export const userRouter = {
  get: protectedProcedure.query(async ({ ctx }) => {
    // Try to find existing user in database
    const users = await ctx.db.select().from(User).where(eq(User.id, ctx.auth.userId)).limit(1)
    let user = users[0]

    // If user doesn't exist or info is outdated (>24h), fetch latest info from Clerk
    if (!user || user.updatedAt < new Date(Date.now() + 1000 * 60 * 60 * 24)) {
      // Get current user info from Clerk
      const info = await currentUser()
      if (!info) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        })
      }

      // If user doesn't exist, create new user
      if (!user) {
        ;[user] = await ctx.db
          .insert(User)
          .values({
            id: ctx.auth.userId,
            info,
          })
          .returning()
      } else {
        // If user exists but outdated, update user info
        ;[user] = await ctx.db
          .update(User)
          .set({
            info,
          })
          .where(eq(User.id, ctx.auth.userId))
          .returning()
      }

      if (!user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create/update user',
        })
      }
    }

    return user
  }),
}
