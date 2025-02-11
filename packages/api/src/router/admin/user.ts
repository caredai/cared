import { clerkClient } from '@clerk/nextjs/server'
import { TRPCError } from '@trpc/server'
import { count, eq } from 'drizzle-orm'
import { z } from 'zod'

import { User } from '@mindworld/db/schema'

import { adminProcedure } from '../../trpc'

export const userRouter = {
  listUsers: adminProcedure
    .input(
      z.object({
        offset: z.number().int().min(0).default(0),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const counts = await ctx.db.select({ count: count() }).from(User)
      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user count',
        })
      }

      const users = await ctx.db
        .select()
        .from(User)
        .orderBy(User.createdAt)
        .offset(input.offset)
        .limit(input.limit)

      return {
        users,
        offset: input.offset,
        limit: input.limit,
        total: counts[0].count,
      }
    }),

  getUsers: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const user = await ctx.db.query.User.findFirst({
      where: eq(User.id, input),
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    return {
      user,
    }
  }),

  deleteUsers: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    // Check if user exists
    const user = await ctx.db.query.User.findFirst({
      where: eq(User.id, input),
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    // TODO: check resources associated with the user

    try {
      return await ctx.db.transaction(async (tx) => {
        // Delete user from database
        await tx.delete(User).where(eq(User.id, input))

        // Delete user from Clerk
        const client = await clerkClient()
        await client.users.deleteUser(input)
      })
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete user',
        cause: error,
      })
    }
  }),
}
