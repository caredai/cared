import { headers } from 'next/headers'
import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import { auth } from '@cared/auth'
import { and, asc, desc, eq, gt, lt, sql } from '@cared/db'
import { user as User } from '@cared/db/schema/auth'

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
          order: z.enum(['desc', 'asc']).default('desc'),
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
        const searchTerm = `%${input.search}%`
        conditions.push(
          sql`(${User.name} ILIKE ${searchTerm} OR
                  ${User.email} ILIKE ${searchTerm}`,
        )
      }

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(User.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(User.id, input.before))
      }

      const query = conditions.length > 0 ? and(...conditions) : undefined

      const users = await ctx.db.query.User.findMany({
        where: query,
        orderBy: input.order === 'desc' ? desc(User.id) : asc(User.id),
        limit: input.limit + 1,
      })

      const hasMore = users.length > input.limit
      if (hasMore) {
        users.pop()
      }

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
   * Deletes user from both database and auth system.
   * @param input - The user ID
   * @throws {TRPCError} If user not found or deletion fails
   */
  deleteUser: adminProcedure.input(z.string()).mutation(async ({ input }) => {
    // Delete user from auth system
    await auth.api.removeUser({
      body: {
        userId: input,
      },
      headers: await headers(),
    })
  }),
}
