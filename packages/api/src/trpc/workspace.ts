import { TRPCError } from '@trpc/server'
import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod/v4'

import { Workspace } from '@cared/db/schema'

import type { BaseContext } from '../trpc'
import { OrganizationScope } from '../auth'
import { cfg } from '../config'
import { protectedProcedure } from '../trpc'
import { createWorkspaceSchema, updateWorkspaceSchema } from '../types'

/**
 * Verify if the user is the owner of the workspace.
 * Note: This function is deprecated and kept for backward compatibility
 * @param _ctx - The context object
 * @param _workspaceId - The workspace ID to verify ownership for
 */
export function verifyWorkspaceOwner(_ctx: BaseContext, _workspaceId: string) {
  // Note: Ownership verification is now handled by the organization system
  // This function is kept for backward compatibility but should be updated
  // to use organization-based permission checks
  return true
}

export const workspaceRouter = {
  /**
   * List all workspaces for the current user.
   * Only accessible by authenticated users.
   * @param input - Pagination parameters
   * @returns List of workspaces
   */
  list: protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/workspaces' } })
    .input(
      z.object({
        organizationId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const scope = OrganizationScope.fromOrganization(ctx, input.organizationId)
      await scope.checkPermissions()

      const workspaces = await ctx.db
        .select()
        .from(Workspace)
        .where(eq(Workspace.organizationId, scope.organizationId))
        .orderBy(desc(Workspace.id))

      return {
        workspaces,
      }
    }),

  /**
   * Get a single workspace by ID.
   * Only accessible by authenticated users who are members of the workspace.
   * @param input - The workspace ID
   * @returns The workspace if found
   * @throws {TRPCError} If workspace not found or user is not a member
   */
  get: protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/workspaces/{id}' } })
    .input(
      z.object({
        id: z.string().min(32),
      }),
    )
    .query(async ({ input, ctx }) => {
      const workspace = await ctx.db.query.Workspace.findFirst({
        where: eq(Workspace.id, input.id),
      })

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        })
      }

      const scope = OrganizationScope.fromOrganization(ctx, workspace.organizationId)
      await scope.checkPermissions()

      return { workspace }
    }),

  create: protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/workspaces' } })
    .input(createWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      const scope = OrganizationScope.fromOrganization(ctx, input.organizationId)
      await scope.checkPermissions({ workspace: ['create'] })

      // Check if user has reached the maximum number of workspaces
      const userWorkspacesCount = await ctx.db
        .select({ count: count() })
        .from(Workspace)
        .where(eq(Workspace, scope.organizationId))
        .then((r) => r[0]!.count)

      if (userWorkspacesCount >= cfg.perOrganization.maxWorkspaces) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You have reached the maximum limit of ${cfg.perOrganization.maxWorkspaces} workspaces`,
        })
      }

      const [workspace] = await ctx.db.insert(Workspace).values(input).returning()
      if (!workspace) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create workspace',
        })
      }

      return {
        workspace,
      }
    }),

  update: protectedProcedure
    .meta({ openapi: { method: 'PATCH', path: '/v1/workspaces/{id}' } })
    .input(updateWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      const scope = await OrganizationScope.fromWorkspace(ctx, input.id)
      await scope.checkPermissions({ workspace: ['update'] })

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

      return { workspace }
    }),

  /**
   * Delete a workspace.
   * Only accessible by users with delete permission.
   * @param input - The workspace ID
   * @throws {TRPCError} If user doesn't have delete permission
   */
  delete: protectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/v1/workspaces/{id}' } })
    .input(
      z.object({
        id: z.string().min(32),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const scope = await OrganizationScope.fromWorkspace(ctx, input.id)
      await scope.checkPermissions({ workspace: ['delete'] })

      // TODO: check other resources
      await ctx.db.delete(Workspace).where(eq(Workspace.id, input.id))
    }),

  /**
   * Transfer workspace ownership to another user.
   * Only accessible by users with update permission.
   * @param input - Object containing workspaceId and userId
   * @throws {TRPCError} If user doesn't have update permission
   */
  transferOwnership: protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/workspaces/{workspaceId}/transfer-ownership' } })
    .input(
      z.object({
        workspaceId: z.string().min(32),
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const scope = await OrganizationScope.fromWorkspace(ctx, input.workspaceId)
      await scope.checkPermissions({ workspace: ['transfer'] })

      // Ensure the target organization exists and user has permission to create workspaces there
      const targetScope = OrganizationScope.fromOrganization(ctx, input.organizationId)
      await targetScope.checkPermissions({ workspace: ['create'] })

      const [workspace] = await ctx.db
        .update(Workspace)
        .set({ organizationId: input.organizationId })
        .where(eq(Workspace.id, input.workspaceId))
        .returning()
      if (!workspace) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to transfer workspace',
        })
      }

      return { workspace }
    }),
}
