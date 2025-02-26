import { clerkClient } from '@clerk/nextjs/server'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { SQL } from '@mindworld/db'
import { and, desc, eq, gt, ilike, lt, or, sql } from '@mindworld/db'
import { User } from '@mindworld/db/schema'

import { adminProcedure } from '../../trpc'

export const userRouter = {
  /**
   * List all users with optional search functionality.
   * Only accessible by admin users.
   * @param input - Object containing search query and pagination parameters
   * @returns List of users with hasMore flag
   */
  listUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: (SQL<unknown> | undefined)[] = []

      // Add search conditions
      if (input.search) {
        conditions.push(
          or(
            ilike(sql`${User.info}->>'username'`, `%${input.search}%`),
            ilike(sql`${User.info}->>'firstName'`, `%${input.search}%`),
            ilike(sql`${User.info}->>'lastName'`, `%${input.search}%`),
            sql`to_tsvector('simple', array_to_string(array(select jsonb_array_elements(${User.info}->'emailAddresses')->>>'emailAddress'), ' ')) @@ to_tsquery('simple', ${input.search}:*)`,
          ),
        )
      }

      // Add cursor conditions
      if (input.after) {
        conditions.push(gt(User.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(User.id, input.before))
      }

      const query = conditions.length > 0 ? and(...conditions) : undefined

      const users = await ctx.db
        .select()
        .from(User)
        .where(query)
        .orderBy(desc(User.id))
        .limit(input.limit + 1)

      const hasMore = users.length > input.limit
      if (hasMore) {
        users.pop()
      }

      return {
        users,
        hasMore,
        limit: input.limit,
      }
    }),

  /**
   * Get a single user by ID.
   * Only accessible by admin users.
   * @param input - The user ID
   * @returns The user if found
   * @throws {TRPCError} If user not found
   */
  getUser: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
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

  /**
   * Delete a user and their associated data.
   * Only accessible by admin users.
   * Deletes user from both database and Clerk.
   * @param input - The user ID
   * @throws {TRPCError} If user not found or deletion fails
   */
  deleteUser: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
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
