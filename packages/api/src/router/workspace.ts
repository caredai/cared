import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@mindworld/db/client'
import {
  CreateMembershipSchema,
  CreateWorkspaceSchema,
  Membership,
  User,
  Workspace,
} from '@mindworld/db/schema'

import { createTRPCRouter, protectedProcedure } from '../trpc'

export const workspaceRouter = createTRPCRouter({
  create: protectedProcedure.input(CreateWorkspaceSchema).mutation(async ({ input, ctx }) => {
    const [workspace] = await db.insert(Workspace).values(input).returning()
    if (!workspace) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create workspace',
      })
    }

    await db.insert(Membership).values({
      workspaceId: workspace.id,
      userId: ctx.auth.userId,
      role: 'owner',
    })

    return workspace
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await db
      .select({
        workspace: Workspace,
        role: Membership.role,
      })
      .from(Membership)
      .innerJoin(Workspace, eq(Workspace.id, Membership.workspaceId))
      .where(eq(Membership.userId, ctx.auth.userId))

    return memberships
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const membership = await db
        .select({
          workspace: Workspace,
          role: Membership.role,
        })
        .from(Membership)
        .innerJoin(Workspace, eq(Workspace.id, Membership.workspaceId))
        .where(and(eq(Membership.workspaceId, input.id), eq(Membership.userId, ctx.auth.userId)))
        .limit(1)

      if (!membership[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found or no access',
        })
      }

      return membership[0]
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().max(255),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const membership = await db
        .select({ role: Membership.role })
        .from(Membership)
        .where(and(eq(Membership.workspaceId, input.id), eq(Membership.userId, ctx.auth.userId)))
        .limit(1)

      if (!membership[0] || membership[0].role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admin can update workspace',
        })
      }

      const [workspace] = await db
        .update(Workspace)
        .set({ name: input.name })
        .where(eq(Workspace.id, input.id))
        .returning()

      return workspace
    }),

  addMember: protectedProcedure.input(CreateMembershipSchema).mutation(async ({ input, ctx }) => {
    const membership = await db
      .select({ role: Membership.role })
      .from(Membership)
      .where(
        and(eq(Membership.workspaceId, input.workspaceId), eq(Membership.userId, ctx.auth.userId)),
      )
      .limit(1)

    if (!membership[0] || membership[0].role !== 'owner') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admin can add members',
      })
    }

    const user = await db.select().from(User).where(eq(User.id, input.userId)).limit(1)

    if (!user[0]) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    const [newMembership] = await db.insert(Membership).values(input).returning()

    return newMembership
  }),

  removeMember: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const membership = await db
        .select({ role: Membership.role })
        .from(Membership)
        .where(
          and(
            eq(Membership.workspaceId, input.workspaceId),
            eq(Membership.userId, ctx.auth.userId),
          ),
        )
        .limit(1)

      if (!membership[0] || membership[0].role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admin can remove members',
        })
      }

      await db
        .delete(Membership)
        .where(
          and(eq(Membership.workspaceId, input.workspaceId), eq(Membership.userId, input.userId)),
        )

      return { success: true }
    }),

  listMembers: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const membership = await db
        .select()
        .from(Membership)
        .where(
          and(
            eq(Membership.workspaceId, input.workspaceId),
            eq(Membership.userId, ctx.auth.userId),
          ),
        )
        .limit(1)

      if (!membership[0]) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a member of this workspace',
        })
      }

      const members = await db
        .select({
          userId: User.id,
          userInfo: User.info,
          role: Membership.role,
        })
        .from(Membership)
        .innerJoin(User, eq(User.id, Membership.userId))
        .where(eq(Membership.workspaceId, input.workspaceId))

      return members
    }),
})
