import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import { and, asc, desc, eq, gt, lt } from '@cared/db'
import { Workspace } from '@cared/db/schema'

import { adminProcedure } from '../../orpc'

export const workspaceRouter = {
  /**
   * List all workspaces across the platform.
   * Only accessible by admin users.
   * @param input - Pagination parameters
   * @returns List of workspaces with hasMore flag
   */
  listWorkspaces: adminProcedure
    .route({
      method: 'GET',
      path: '/v1/admin/workspaces',
      tags: ['admin'],
      summary: 'List all workspaces across the platform',
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
    .handler(async ({ context, input }) => {
      const conditions: SQL<unknown>[] = []

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Workspace.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Workspace.id, input.before))
      }

      const query = conditions.length > 0 ? and(...conditions) : undefined

      const workspaces = await context.db.query.Workspace.findMany({
        where: query,
        orderBy: input.order === 'desc' ? desc(Workspace.id) : asc(Workspace.id),
        limit: input.limit + 1,
      })

      const hasMore = workspaces.length > input.limit
      if (hasMore) {
        workspaces.pop()
      }

      // Get first and last workspace IDs
      const first = workspaces[0]?.id
      const last = workspaces[workspaces.length - 1]?.id

      return {
        workspaces,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Get a single workspace by ID.
   * Only accessible by admin users.
   * @param input - The workspace ID
   * @returns The workspace if found
   * @throws {ORPCError} If workspace not found
   */
  getWorkspace: adminProcedure
    .route({
      method: 'GET',
      path: '/v1/admin/workspaces/{id}',
      tags: ['admin'],
      summary: 'Get a single workspace by ID',
    })
    .input(z.string().min(32))
    .handler(async ({ context, input }) => {
      const workspace = await context.db.query.Workspace.findFirst({
        where: eq(Workspace.id, input),
      })

      if (!workspace) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Workspace not found',
        })
      }

      return {
        workspace,
      }
    }),
}
