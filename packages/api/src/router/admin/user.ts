import { clerkClient } from '@clerk/nextjs/server'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { SQL } from '@mindworld/db'
import { and, desc, eq, gt, lt, sql } from '@mindworld/db'
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
      z
        .object({
          search: z.string().optional(),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .query(async ({ ctx, input }) => {
      const conditions: (SQL<unknown> | undefined)[] = []

      // Add search conditions
      if (input.search) {
        conditions.push(
          sql`to_tsvector('english', ${User.info}::jsonb) @@ to_tsquery('english', ${input.search})`,
        )
      }

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(User.id, input.after))
      } else if (input.before) {
        conditions.push(lt(User.id, input.before))
      }

      const query = conditions.length > 0 ? and(...conditions) : undefined

      // Determine if this is backward pagination
      const isBackwardPagination = !!input.before

      // Fetch users with appropriate ordering
      let users
      if (isBackwardPagination) {
        users = await ctx.db
          .select()
          .from(User)
          .where(query)
          .orderBy(User.id) // Ascending order
          .limit(input.limit + 1)
      } else {
        users = await ctx.db
          .select()
          .from(User)
          .where(query)
          .orderBy(desc(User.id)) // Descending order
          .limit(input.limit + 1)
      }

      const hasMore = users.length > input.limit
      if (hasMore) {
        users.pop()
      }

      // Reverse results for backward pagination to maintain consistent ordering
      users = isBackwardPagination ? users.reverse() : users

      // Get first and last user IDs
      const first = users[0]?.id
      const last = users[users.length - 1]?.id

      return {
        users,
        hasMore,
        first,
        last,
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
