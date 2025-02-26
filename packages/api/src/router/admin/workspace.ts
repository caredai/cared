import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { SQL } from '@mindworld/db'
import { and, desc, eq, gt, lt } from '@mindworld/db'
import { Membership, User, Workspace } from '@mindworld/db/schema'

import { adminProcedure } from '../../trpc'

export const workspaceRouter = {
  /**
   * List all workspaces across the platform.
   * Only accessible by admin users.
   * @param input - Pagination parameters
   * @returns List of workspaces with hasMore flag
   */
  listWorkspaces: adminProcedure
    .input(
      z.object({
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL<unknown>[] = []

      // Add cursor conditions
      if (input.after) {
        conditions.push(gt(Workspace.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Workspace.id, input.before))
      }

      const query = conditions.length > 0 ? and(...conditions) : undefined

      const workspaces = await ctx.db
        .select()
        .from(Workspace)
        .where(query)
        .orderBy(desc(Workspace.id))
        .limit(input.limit + 1)

      const hasMore = workspaces.length > input.limit
      if (hasMore) {
        workspaces.pop()
      }

      return {
        workspaces,
        hasMore,
        limit: input.limit,
      }
    }),

  /**
   * Get a single workspace by ID.
   * Only accessible by admin users.
   * @param input - The workspace ID
   * @returns The workspace if found
   * @throws {TRPCError} If workspace not found
   */
  getWorkspace: adminProcedure.input(z.string().min(32)).query(async ({ ctx, input }) => {
    const workspace = await ctx.db.query.Workspace.findFirst({
      where: eq(Workspace.id, input),
    })

    if (!workspace) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Workspace not found',
      })
    }

    return {
      workspace,
    }
  }),

  /**
   * List all members of a specific workspace.
   * Only accessible by admin users.
   * @param input - Object containing workspaceId and pagination parameters
   * @returns List of workspace members with their roles and pagination info
   */
  listMembers: adminProcedure
    .input(
      z.object({
        workspaceId: z.string().min(32),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL<unknown>[] = [eq(Membership.workspaceId, input.workspaceId)]

      // Add cursor conditions
      if (input.after) {
        conditions.push(gt(User.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(User.id, input.before))
      }

      const members = await ctx.db
        .select({
          user: User,
          role: Membership.role,
        })
        .from(Membership)
        .innerJoin(User, eq(User.id, Membership.userId))
        .where(and(...conditions))
        .orderBy(desc(Membership.role), desc(Membership.createdAt))
        .limit(input.limit + 1)

      const hasMore = members.length > input.limit
      if (hasMore) {
        members.pop()
      }

      return {
        members,
        hasMore,
        limit: input.limit,
      }
    }),

  /**
   * Get a specific member of a workspace.
   * Only accessible by admin users.
   * @param input - Object containing workspaceId and userId
   * @returns The member's user info and role if found
   * @throws {TRPCError} If member not found
   */
  getMember: adminProcedure
    .input(
      z.object({
        workspaceId: z.string().min(32),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const member = await ctx.db
        .select({
          user: User,
          role: Membership.role,
        })
        .from(Membership)
        .innerJoin(User, eq(User.id, Membership.userId))
        .where(
          and(eq(Membership.workspaceId, input.workspaceId), eq(Membership.userId, input.userId)),
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        })
      }

      return member
    }),
}
