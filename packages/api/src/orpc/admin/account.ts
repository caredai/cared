import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import { and, asc, desc, eq, gt, lt } from '@cared/db'
import { Account, Member, User } from '@cared/db/schema'
import { db } from '@cared/db/client'

import { adminProcedure } from '../../orpc'

export const accountRouter = {
  /**
   * List all accounts across the platform.
   * Only accessible by admin users.
   * @param input - Pagination parameters
   * @returns List of accounts with hasMore flag
   */
  listAccounts: adminProcedure
    .route({
      method: 'GET',
      path: '/v1/admin/accounts',
      tags: ['admin'],
      summary: 'List all accounts across the platform',
    })
    .input(
      z
        .object({
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          order: z.enum(['desc', 'asc']).default('desc'),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .handler(async ({ input }) => {
      const conditions: SQL<unknown>[] = []

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Account.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Account.id, input.before))
      }

      const query = conditions.length > 0 ? and(...conditions) : undefined

      const accounts = await db.query.Account.findMany({
        where: query,
        orderBy: input.order === 'desc' ? desc(Account.id) : asc(Account.id),
        limit: input.limit + 1,
      })

      const hasMore = accounts.length > input.limit
      if (hasMore) {
        accounts.pop()
      }

      // Get first and last account IDs
      const first = accounts[0]?.id
      const last = accounts[accounts.length - 1]?.id

      return {
        accounts,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Get a single account by ID.
   * Only accessible by admin users.
   * @param input - The account ID
   * @returns The account if found
   * @throws {ORPCError} If account not found
   */
  getAccount: adminProcedure
    .route({
      method: 'GET',
      path: '/v1/admin/accounts/{id}',
      tags: ['admin'],
      summary: 'Get a single account by ID',
    })
    .input(z.string().min(32))
    .handler(async ({ input }) => {
      const account = await db.query.Account.findFirst({
        where: eq(Account.id, input),
      })

      if (!account) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Account not found',
        })
      }

      return {
        account,
      }
    }),

  /**
   * List all members of a specific account.
   * Only accessible by admin users.
   * @param input - Object containing account ID and pagination parameters
   * @returns List of account members with user details and hasMore flag
   */
  listMembers: adminProcedure
    .route({
      method: 'GET',
      path: '/v1/admin/accounts/{accountId}/members',
      tags: ['admin'],
      summary: 'List all members of a specific account',
    })
    .input(
      z
        .object({
          accountId: z.string().min(32),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          order: z.enum(['desc', 'asc']).default('desc'),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .handler(async ({ input }) => {
      // First verify the account exists
      const account = await db.query.Account.findFirst({
        where: eq(Account.id, input.accountId),
      })

      if (!account) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Account not found',
        })
      }

      const conditions: SQL<unknown>[] = [eq(Member.accountId, input.accountId)]

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Member.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Member.id, input.before))
      }

      const query = and(...conditions)

      // Fetch members with user details and appropriate ordering
      const members = await db
        .select({
          id: Member.id,
          role: Member.role,
          createdAt: Member.createdAt,
          user: User,
        })
        .from(Member)
        .innerJoin(User, eq(Member.userId, User.id))
        .where(query)
        .orderBy(input.order === 'desc' ? desc(Member.id) : asc(Member.id))
        .limit(input.limit + 1)

      const hasMore = members.length > input.limit
      if (hasMore) {
        members.pop()
      }

      // Get first and last member IDs
      const first = members[0]?.id
      const last = members[members.length - 1]?.id

      return {
        members,
        hasMore,
        first,
        last,
      }
    }),
}

