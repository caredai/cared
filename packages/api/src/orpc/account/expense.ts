import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import { and, desc, eq, inArray, lt } from '@cared/db'
import { db } from '@cared/db/client'
import { Expense, expenseKinds } from '@cared/db/schema'

import { userProtectedProcedure } from '../../orpc'

export const expenseRouter = {
  list: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/expenses',
      tags: ['expenses'],
      summary: 'List expenses for current user',
    })
    .input(
      z.object({
        allMembers: z.boolean().optional(),
        expenseKinds: z.array(z.enum(expenseKinds)).optional(),
        appId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const conditions: SQL<unknown>[] = []

      conditions.push(eq(Expense.accountId, context.auth.accountId))

      if (!input.allMembers) {
        conditions.push(eq(Expense.userId, context.auth.userId))
      }

      // Filter by expense kinds if provided
      if (input.expenseKinds) {
        conditions.push(inArray(Expense.kind, input.expenseKinds))
      }

      // Filter by app if provided
      if (input.appId) {
        conditions.push(eq(Expense.oauthAppId, input.appId))
      }

      // Pagination cursor
      if (input.cursor) {
        conditions.push(lt(Expense.id, input.cursor))
      }

      const query = and(...conditions)

      const expenses = await db
        .select()
        .from(Expense)
        .where(query)
        .orderBy(desc(Expense.createdAt))
        .limit(input.limit + 1)

      const hasMore = expenses.length > input.limit
      if (hasMore) {
        expenses.pop()
      }
      const cursor = expenses.at(-1)?.id

      return {
        expenses,
        hasMore,
        cursor,
      }
    }),
}
