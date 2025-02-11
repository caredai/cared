import { TRPCError } from '@trpc/server'
import { and, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { Membership, User, Workspace } from '@mindworld/db/schema'

import { adminProcedure } from '../../trpc'

export const workspaceRouter = {
  listWorkspaces: adminProcedure
    .input(
      z.object({
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const counts = await ctx.db.select({ count: count() }).from(Workspace)
      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get workspace count',
        })
      }

      const workspaces = await ctx.db
        .select()
        .from(Workspace)
        .orderBy(desc(Workspace.createdAt))
        .offset(input.offset)
        .limit(input.limit)

      return {
        workspaces,
        offset: input.offset,
        limit: input.limit,
        total: counts[0].count,
      }
    }),

  getWorkspace: adminProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
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

  listMembers: adminProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const counts = await ctx.db
        .select({ count: count() })
        .from(Membership)
        .where(eq(Membership.workspaceId, input.workspaceId))

      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get member count',
        })
      }

      const members = await ctx.db
        .select({
          user: User,
          role: Membership.role,
        })
        .from(Membership)
        .innerJoin(User, eq(User.id, Membership.userId))
        .where(eq(Membership.workspaceId, input.workspaceId))
        .orderBy(desc(Membership.role), desc(Membership.createdAt))
        .offset(input.offset)
        .limit(input.limit)

      return {
        members,
        offset: input.offset,
        limit: input.limit,
        total: counts[0].count,
      }
    }),

  getMember: adminProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
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
