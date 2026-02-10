import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import { and, desc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Integration } from '@cared/db/schema'

import { protectedProcedure } from '../../orpc'

export const integrationRouter = {
  /**
   * List all integrations for the current account.
   * Only accessible by authenticated users.
   * @returns List of integrations
   */
  list: protectedProcedure
    .route({
      method: 'GET',
      path: '/integrations',
      tags: ['integration'],
      summary: 'List integrations',
    })
    .input(
      z
        .object({
          type: z.enum(['github', 'cloudflare', 'neon', 'supabase']).optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      // Build where conditions
      const conditions = [eq(Integration.accountId, context.auth.accountId)]
      if (input?.type) {
        conditions.push(eq(Integration.type, input.type))
      }

      const integrations = await db
        .select()
        .from(Integration)
        .where(and(...conditions))
        .orderBy(desc(Integration.createdAt))

      return {
        integrations,
      }
    }),

  /**
   * Get a single integration by ID.
   * Only accessible by authenticated users.
   * @returns Integration details
   */
  get: protectedProcedure
    .route({
      method: 'GET',
      path: '/integrations/{id}',
      tags: ['integration'],
      summary: 'Get integration by ID',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [integration] = await db
        .select()
        .from(Integration)
        .where(and(eq(Integration.id, input.id), eq(Integration.accountId, context.auth.accountId)))
        .limit(1)

      if (!integration) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Integration not found',
        })
      }

      return {
        integration,
      }
    }),
}
