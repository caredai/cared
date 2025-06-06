import { TRPCError } from '@trpc/server'
import { and, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import type { Transaction } from '@ownxai/db/client'
import {
  CreateMembershipSchema,
  CreateWorkspaceSchema,
  Membership,
  UpdateWorkspaceSchema,
  User,
  Workspace,
} from '@ownxai/db/schema'

import type { Context } from '../trpc'
import { cfg } from '../config'
import { userProtectedProcedure } from '../trpc'

/**
 * Verify if the user is a member of the workspace
 */
export async function verifyWorkspaceMembership(ctx: Context, workspaceId: string) {
  const membership = await ctx.db.query.Membership.findFirst({
    where: and(eq(Membership.workspaceId, workspaceId), eq(Membership.userId, ctx.auth.userId!)),
  })

  if (!membership) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this workspace',
    })
  }

  return membership
}

/**
 * Verify if the user is the owner of the workspace.
 * @param ctx - The context object
 * @param workspaceId - The workspace ID to verify ownership for
 * @throws {TRPCError} If user is not the workspace owner
 */
export async function verifyWorkspaceOwner(ctx: Context, workspaceId: string) {
  const membership = await verifyWorkspaceMembership(ctx, workspaceId)

  if (membership.role !== 'owner') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only workspace owner can perform this action',
    })
  }

  return membership
}

async function createWorkspace(
  ctx: Context,
  tx: Transaction,
  input: z.infer<typeof CreateWorkspaceSchema>,
) {
  // Check if user has reached the maximum number of workspaces
  const userWorkspacesCount = await tx
    .select({ count: count() })
    .from(Membership)
    .where(eq(Membership.userId, ctx.auth.userId!))
    .then((r) => r[0]!.count)

  if (userWorkspacesCount >= cfg.perUser.maxWorkspaces) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You have reached the maximum limit of ${cfg.perUser.maxWorkspaces} workspaces`,
    })
  }

  const [workspace] = await tx.insert(Workspace).values(input).returning()
  if (!workspace) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create workspace',
    })
  }

  await tx.insert(Membership).values({
    workspaceId: workspace.id,
    userId: ctx.auth.userId!,
    role: 'owner',
  })

  return {
    workspace,
    role: 'owner' as const,
  }
}

export const workspaceRouter = {
  /**
   * List all workspaces for the current user.
   * Only accessible by authenticated users.
   * @param input - Pagination parameters
   * @returns List of workspaces with user's role in each workspace
   */
  list: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/workspaces' } })
    .input(z.void())
    .query(async ({ ctx }) => {
      return await ctx.db.transaction(async (tx) => {
        const workspaces = await tx
          .select({
            workspace: Workspace,
            role: Membership.role,
          })
          .from(Membership)
          .innerJoin(Workspace, eq(Workspace.id, Membership.workspaceId))
          .where(eq(Membership.userId, ctx.auth.userId))
          .orderBy(desc(Workspace.id))

        // If no workspaces are found, create a personal workspace
        if (!workspaces.length) {
          workspaces.push(
            await createWorkspace(ctx, tx, {
              name: 'My workspace',
            }),
          )
        }

        return {
          workspaces,
        }
      })
    }),

  /**
   * Get a single workspace by ID.
   * Only accessible by authenticated users who are members of the workspace.
   * @param input - The workspace ID
   * @returns The workspace and user's role if found
   * @throws {TRPCError} If workspace not found or user is not a member
   */
  get: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/workspaces/{id}' } })
    .input(
      z.object({
        id: z.string().min(32),
      }),
    )
    .query(async ({ input, ctx }) => {
      const workspace = await ctx.db
        .select({
          workspace: Workspace,
          role: Membership.role,
        })
        .from(Membership)
        .innerJoin(Workspace, eq(Workspace.id, Membership.workspaceId))
        .where(and(eq(Membership.workspaceId, input.id), eq(Membership.userId, ctx.auth.userId)))
        .limit(1)
        .then((rows) => rows[0])

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        })
      }

      return workspace
    }),

  create: userProtectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/workspaces' } })
    .input(CreateWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.transaction(async (tx) => {
        return createWorkspace(ctx, tx, input)
      })
    }),

  update: userProtectedProcedure
    .meta({ openapi: { method: 'PATCH', path: '/v1/workspaces/{id}' } })
    .input(UpdateWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      const memberships = await ctx.db
        .select({ role: Membership.role })
        .from(Membership)
        .where(and(eq(Membership.workspaceId, input.id), eq(Membership.userId, ctx.auth.userId)))
        .limit(1)

      if (memberships[0]?.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owner can update workspace',
        })
      }

      const [workspace] = await ctx.db
        .update(Workspace)
        .set({ name: input.name })
        .where(eq(Workspace.id, input.id))
        .returning()

      if (!workspace) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update workspace',
        })
      }

      return {
        workspace,
        role: 'owner' as const,
      }
    }),

  /**
   * Delete a workspace.
   * Only accessible by the workspace owner.
   * Deletes all memberships before deleting the workspace.
   * @param input - The workspace ID
   * @throws {TRPCError} If user is not the workspace owner
   */
  delete: userProtectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/v1/workspaces/{id}' } })
    .input(
      z.object({
        id: z.string().min(32),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.transaction(async (tx) => {
        const memberships = await tx
          .select({ role: Membership.role })
          .from(Membership)
          .where(and(eq(Membership.workspaceId, input.id), eq(Membership.userId, ctx.auth.userId)))
          .limit(1)

        if (memberships[0]?.role !== 'owner') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only owner can delete workspace',
          })
        }

        // Delete all memberships first
        await tx.delete(Membership).where(eq(Membership.workspaceId, input.id))

        // Then delete the workspace
        await tx.delete(Workspace).where(eq(Workspace.id, input.id))
      })
    }),

  /**
   * List all members of a workspace.
   * Only accessible by workspace members.
   * @param input - The workspace ID and pagination parameters
   * @returns List of workspace members with their roles
   */
  listMembers: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/workspaces/{workspaceId}/members' } })
    .input(
      z.object({
        workspaceId: z.string().min(32),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if the current user is a member of the workspace
      const currentMembership = await ctx.db.query.Membership.findFirst({
        where: (membership, { and, eq }) =>
          and(
            eq(membership.workspaceId, input.workspaceId),
            eq(membership.userId, ctx.auth.userId),
          ),
      })

      if (!currentMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
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
        .orderBy(desc(User.id))

      return {
        members,
      }
    }),

  /**
   * Get a specific member of a workspace.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId and userId
   * @returns The member's user info and role if found
   * @throws {TRPCError} If member not found or user doesn't have access
   */
  getMember: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/workspaces/{workspaceId}/members/{userId}' } })
    .input(
      z.object({
        workspaceId: z.string().min(32),
        userId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if the current user is a member of the workspace
      const currentMembership = await ctx.db.query.Membership.findFirst({
        where: (membership, { and, eq }) =>
          and(
            eq(membership.workspaceId, input.workspaceId),
            eq(membership.userId, ctx.auth.userId),
          ),
      })

      if (!currentMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        })
      }

      const [member] = await ctx.db
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

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        })
      }

      return {
        ...member,
      }
    }),

  addMember: userProtectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/workspaces/{workspaceId}/members' } })
    .input(CreateMembershipSchema)
    .mutation(async ({ input, ctx }) => {
      const memberships = await ctx.db
        .select({ role: Membership.role })
        .from(Membership)
        .where(
          and(
            eq(Membership.workspaceId, input.workspaceId),
            eq(Membership.userId, ctx.auth.userId),
          ),
        )
        .limit(1)

      if (memberships[0]?.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owner can add members',
        })
      }

      // Check if workspace has reached the maximum number of members
      const membersCount = await ctx.db
        .select({ count: count() })
        .from(Membership)
        .where(eq(Membership.workspaceId, input.workspaceId))
        .then((r) => r[0]!.count)

      if (membersCount >= cfg.perWorkspace.maxMembers) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Workspace has reached the maximum limit of ${cfg.perWorkspace.maxMembers} members`,
        })
      }

      // Check if the user being added has reached their maximum number of workspaces
      const userWorkspacesCount = await ctx.db
        .select({ count: count() })
        .from(Membership)
        .where(eq(Membership.userId, input.userId))
        .then((r) => r[0]!.count)

      if (userWorkspacesCount >= cfg.perUser.maxWorkspaces) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `User has reached the maximum limit of ${cfg.perUser.maxWorkspaces} workspaces`,
        })
      }

      const user = await ctx.db.query.User.findFirst({
        where: eq(User.id, input.userId),
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      if (input.role !== 'member') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Role can only be "member"',
        })
      }

      const [membership] = await ctx.db.insert(Membership).values(input).returning()

      if (!membership) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add member',
        })
      }

      return {
        user,
        role: membership.role,
      }
    }),

  deleteMember: userProtectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/v1/workspaces/{workspaceId}/members/{userId}' } })
    .input(
      z.object({
        workspaceId: z.string().min(32),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const memberships = await ctx.db
        .select({ role: Membership.role })
        .from(Membership)
        .where(
          and(
            eq(Membership.workspaceId, input.workspaceId),
            eq(Membership.userId, ctx.auth.userId),
          ),
        )
        .limit(1)

      if (memberships[0]?.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owner can delete members',
        })
      }

      // Owner cannot be deleted
      if (input.userId === ctx.auth.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Owner cannot be deleted',
        })
      }

      await ctx.db
        .delete(Membership)
        .where(
          and(eq(Membership.workspaceId, input.workspaceId), eq(Membership.userId, input.userId)),
        )
    }),

  transferOwner: userProtectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/workspaces/{workspaceId}/transfer-ownership' } })
    .input(
      z.object({
        workspaceId: z.string().min(32),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.transaction(async (tx) => {
        // Check if current user is the owner
        const currentMembership = await tx
          .select()
          .from(Membership)
          .where(
            and(
              eq(Membership.workspaceId, input.workspaceId),
              eq(Membership.userId, ctx.auth.userId),
            ),
          )
          .limit(1)

        if (currentMembership[0]?.role !== 'owner') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only owner can transfer ownership',
          })
        }

        // Check if new owner exists and is a member
        const newOwnerMembership = await tx
          .select()
          .from(Membership)
          .where(
            and(eq(Membership.workspaceId, input.workspaceId), eq(Membership.userId, input.userId)),
          )
          .limit(1)

        if (!newOwnerMembership[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'New owner must be an existing member',
          })
        }

        // Update current owner to member
        await tx
          .update(Membership)
          .set({ role: 'member' })
          .where(
            and(
              eq(Membership.workspaceId, input.workspaceId),
              eq(Membership.userId, ctx.auth.userId),
            ),
          )

        // Update new owner
        await tx
          .update(Membership)
          .set({ role: 'owner' })
          .where(
            and(eq(Membership.workspaceId, input.workspaceId), eq(Membership.userId, input.userId)),
          )
      })
    }),
}
