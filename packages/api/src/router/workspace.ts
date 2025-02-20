import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import {
  CreateMembershipSchema,
  CreateWorkspaceSchema,
  Membership,
  UpdateWorkspaceSchema,
  User,
  Workspace,
} from '@mindworld/db/schema'

import type { Context } from '../trpc'
import { protectedProcedure } from '../trpc'

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

export const workspaceRouter = {
  /**
   * List all workspaces for the current user.
   * Only accessible by authenticated users.
   * @param input - Pagination parameters
   * @returns List of workspaces with user's role in each workspace
   */
  list: protectedProcedure
    .input(
      z.object({
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input, ctx }) => {
      const workspaces = await ctx.db
        .select({
          workspace: Workspace,
          role: Membership.role,
        })
        .from(Membership)
        .innerJoin(Workspace, eq(Workspace.id, Membership.workspaceId))
        .where(eq(Membership.userId, ctx.auth.userId))
        .orderBy(desc(Workspace.createdAt))
        .offset(input.offset)
        .limit(input.limit)
      return {
        workspaces,
        offset: input.offset,
        limit: input.limit,
      }
    }),

  /**
   * Get a single workspace by ID.
   * Only accessible by authenticated users who are members of the workspace.
   * @param input - The workspace ID
   * @returns The workspace and user's role if found
   * @throws {TRPCError} If workspace not found or user is not a member
   */
  get: protectedProcedure.input(z.string().uuid()).query(async ({ input, ctx }) => {
    const workspace = await ctx.db
      .select({
        workspace: Workspace,
        role: Membership.role,
      })
      .from(Membership)
      .innerJoin(Workspace, eq(Workspace.id, Membership.workspaceId))
      .where(and(eq(Membership.workspaceId, input), eq(Membership.userId, ctx.auth.userId)))
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

  create: protectedProcedure.input(CreateWorkspaceSchema).mutation(async ({ input, ctx }) => {
    return await ctx.db.transaction(async (tx) => {
      const [workspace] = await tx.insert(Workspace).values(input).returning()
      if (!workspace) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create workspace',
        })
      }

      await tx.insert(Membership).values({
        workspaceId: workspace.id,
        userId: ctx.auth.userId,
        role: 'owner',
      })

      return {
        workspace,
        role: 'owner',
      }
    })
  }),

  update: protectedProcedure.input(UpdateWorkspaceSchema).mutation(async ({ input, ctx }) => {
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
      role: 'owner',
    }
  }),

  /**
   * Delete a workspace.
   * Only accessible by the workspace owner.
   * Deletes all memberships before deleting the workspace.
   * @param input - The workspace ID
   * @throws {TRPCError} If user is not the workspace owner
   */
  delete: protectedProcedure.input(z.string().uuid()).mutation(async ({ input, ctx }) => {
    return await ctx.db.transaction(async (tx) => {
      const memberships = await tx
        .select({ role: Membership.role })
        .from(Membership)
        .where(and(eq(Membership.workspaceId, input), eq(Membership.userId, ctx.auth.userId)))
        .limit(1)

      if (memberships[0]?.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owner can delete workspace',
        })
      }

      // Delete all memberships first
      await tx.delete(Membership).where(eq(Membership.workspaceId, input))

      // Then delete the workspace
      await tx.delete(Workspace).where(eq(Workspace.id, input))
    })
  }),

  /**
   * List all members of a workspace.
   * Only accessible by workspace members.
   * @param input - The workspace ID and pagination parameters
   * @returns List of workspace members with their roles
   */
  listMembers: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
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

      const members = (
        await ctx.db
          .select({
            user: User,
            role: Membership.role,
          })
          .from(Membership)
          .innerJoin(User, eq(User.id, Membership.userId))
          .where(eq(Membership.workspaceId, input.workspaceId))
          .orderBy(
            desc(Membership.role), // Sort 'owner' first since it's alphabetically greater than 'member' when using desc
            desc(Membership.createdAt),
          )
          .offset(input.offset)
          .limit(input.limit)
      ).map((member) => ({ ...member, user: filteredUser(member.user) }))

      return {
        members,
        offset: input.offset,
        limit: input.limit,
      }
    }),

  /**
   * Get a specific member of a workspace.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId and userId
   * @returns The member's user info and role if found
   * @throws {TRPCError} If member not found or user doesn't have access
   */
  getMember: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
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
        user: filteredUser(member.user),
      }
    }),

  addMember: protectedProcedure.input(CreateMembershipSchema).mutation(async ({ input, ctx }) => {
    const memberships = await ctx.db
      .select({ role: Membership.role })
      .from(Membership)
      .where(
        and(eq(Membership.workspaceId, input.workspaceId), eq(Membership.userId, ctx.auth.userId)),
      )
      .limit(1)

    if (memberships[0]?.role !== 'owner') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only owner can add members',
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
      user: filteredUser(user),
      role: membership.role,
    }
  }),

  deleteMember: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
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

  transferOwner: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
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

function filteredUser(user: User) {
  const info = user.info
  return {
    ...user,
    info: {
      username: info.username!, // this requires enabling "Users can set usernames to their account" in Clerk
      firstName: info.firstName,
      lastName: info.lastName,
      imageUrl: info.imageUrl,
      hasImage: info.hasImage,
    },
  }
}
