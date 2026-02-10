import { z } from 'zod/v4'

import { protectedProcedure } from '../../orpc'
import { DatabaseTier, neonService } from '../../service/neon/neon'

/**
 * Allowed Neon regions for database namespaces
 */
export const ALLOWED_DATABASE_REGIONS = [
  'aws-us-east-1', // 🇺🇸 AWS US East (N. Virginia)
  'aws-us-east-2', // 🇺🇸 AWS US East (Ohio)
  'aws-us-west-2', // 🇺🇸 AWS US West (Oregon)
  'aws-eu-central-1', // 🇩🇪 AWS Europe (Frankfurt)
  'aws-eu-west-2', // 🇬🇧 AWS Europe (London)
  'aws-ap-southeast-1', // 🇸🇬 AWS Asia Pacific (Singapore)
  'aws-ap-southeast-2', // 🇦🇺 AWS Asia Pacific (Sydney)
  'aws-sa-east-1', // 🇧🇷 AWS South America (São Paulo)
] as const satisfies readonly string[]

export type AllowedDatabaseRegion = (typeof ALLOWED_DATABASE_REGIONS)[number]

export const databaseRouter = {
  /**
   * List all database namespaces (Neon projects) for the current account.
   * @returns List of database namespaces
   */
  listNamespaces: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces',
      tags: ['database'],
      summary: 'List database namespaces',
    })
    .handler(async ({ context }) => {
      return await neonService.listNamespaces(context.auth.accountId)
    }),

  /**
   * Get a single database namespace by ID.
   * @returns Database namespace details
   */
  getNamespace: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{id}',
      tags: ['database'],
      summary: 'Get database namespace by ID',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.getNamespace(context.auth.accountId, input.id)
    }),

  /**
   * Create a new database namespace (Neon project).
   * @returns Created database namespace
   */
  createNamespace: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces',
      tags: ['database'],
      summary: 'Create database namespace',
    })
    .input(
      z.object({
        name: z.string().min(1),
        tier: z.nativeEnum(DatabaseTier),
        regionId: z.enum(ALLOWED_DATABASE_REGIONS),
        pgVersion: z.int().min(17).max(18).default(17),
        settings: z
          .object({
            activeTimeSeconds: z.int().default(2700000), // 750 hours of compute activity per month
            logicalSizeBytes: z.int().default(10737418240), // 	10 GB storage limit
            dataTransferBytes: z.int().default(53687091200), // 50 GB data transfer per month
            autoscalingLimitMinCu: z.number().min(0.25).default(0.25),
            autoscalingLimitMaxCu: z.number().max(16).default(16),
            // `-1` means never suspend.
            // The minimum value is `60` seconds (1 minute).
            // The maximum value is `604800` seconds (1 week).
            suspendTimeoutSeconds: z
              .union([z.literal(-1), z.int().min(60).max(604800)])
              .default(300),
          })
          .optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.createNamespace(context.auth.accountId, {
        name: input.name,
        tier: input.tier,
        regionId: input.regionId,
        pgVersion: input.pgVersion,
        settings: input.settings,
      })
    }),

  /**
   * Update a database namespace.
   * @returns Updated database namespace
   */
  updateNamespace: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/database-namespaces/{id}',
      tags: ['database'],
      summary: 'Update database namespace',
    })
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.updateNamespace(context.auth.accountId, input.id, {
        name: input.name,
      })
    }),

  /**
   * Delete a database namespace (Neon project).
   * @returns Deletion result
   */
  deleteNamespace: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/database-namespaces/{id}',
      tags: ['database'],
      summary: 'Delete database namespace',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await neonService.deleteNamespace(context.auth.accountId, input.id)
    }),

  /**
   * List all branches for a database namespace.
   * @returns List of branches
   */
  listBranches: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches',
      tags: ['database'],
      summary: 'List branches',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(10000).default(100),
        cursor: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.listBranches(context.auth.accountId, input.namespaceId, {
        search: input.search,
        limit: input.limit,
        cursor: input.cursor,
      })
    }),

  /**
   * Get a single branch by ID.
   * @returns Branch details
   */
  getBranch: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}',
      tags: ['database'],
      summary: 'Get branch by ID',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.getBranch(context.auth.accountId, input.namespaceId, input.branchId)
    }),

  /**
   * Create a new branch.
   * @returns Created branch
   */
  createBranch: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/branches',
      tags: ['database'],
      summary: 'Create branch',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        name: z.string().max(256).optional(),
        parentId: z.string().optional(),
        parentLsn: z.string().optional(),
        parentTimestamp: z.string().optional(),
        protected: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.createBranch(context.auth.accountId, input.namespaceId, {
        name: input.name,
        parentId: input.parentId,
        parentLsn: input.parentLsn,
        parentTimestamp: input.parentTimestamp,
        protected: input.protected,
      })
    }),

  /**
   * Update a branch.
   * @returns Updated branch
   */
  updateBranch: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}',
      tags: ['database'],
      summary: 'Update branch',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        name: z.string().max(256).optional(),
        protected: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.updateBranch(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        {
          name: input.name,
          protected: input.protected,
        },
      )
    }),

  /**
   * Delete a branch.
   * @returns Deletion result
   */
  deleteBranch: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}',
      tags: ['database'],
      summary: 'Delete branch',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.deleteBranch(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
      )
    }),

  /**
   * List all databases for a branch.
   * @returns List of databases
   */
  listDatabases: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/databases',
      tags: ['database'],
      summary: 'List databases',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.listDatabases(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
      )
    }),

  /**
   * Get a single database by name.
   * @returns Database details
   */
  getDatabase: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/databases/{databaseName}',
      tags: ['database'],
      summary: 'Get database by name',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        databaseName: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.getDatabase(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.databaseName,
      )
    }),

  /**
   * Create a new database.
   * @returns Created database
   */
  createDatabase: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/databases',
      tags: ['database'],
      summary: 'Create database',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        name: z.string().min(1),
        ownerName: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.createDatabase(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        {
          name: input.name,
          ownerName: input.ownerName,
        },
      )
    }),

  /**
   * Update a database.
   * @returns Updated database
   */
  updateDatabase: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/databases/{databaseName}',
      tags: ['database'],
      summary: 'Update database',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        databaseName: z.string(),
        name: z.string().min(1).optional(),
        ownerName: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.updateDatabase(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.databaseName,
        {
          name: input.name,
          ownerName: input.ownerName,
        },
      )
    }),

  /**
   * Delete a database.
   * @returns Deletion result
   */
  deleteDatabase: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/databases/{databaseName}',
      tags: ['database'],
      summary: 'Delete database',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        databaseName: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.deleteDatabase(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.databaseName,
      )
    }),

  /**
   * List all roles for a branch.
   * @returns List of roles
   */
  listRoles: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/roles',
      tags: ['database'],
      summary: 'List roles',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.listRoles(context.auth.accountId, input.namespaceId, input.branchId)
    }),

  /**
   * Get a single role by name.
   * @returns Role details
   */
  getRole: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/roles/{roleName}',
      tags: ['database'],
      summary: 'Get role by name',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        roleName: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.getRole(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.roleName,
      )
    }),

  /**
   * Get role password.
   * @returns Role password
   */
  getRolePassword: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/roles/{roleName}/password',
      tags: ['database'],
      summary: 'Get role password',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        roleName: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.getRolePassword(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.roleName,
      )
    }),

  /**
   * Create a new role.
   * @returns Created role
   */
  createRole: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/roles',
      tags: ['database'],
      summary: 'Create role',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        name: z.string().min(1),
        noLogin: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.createRole(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        {
          name: input.name,
          noLogin: input.noLogin,
        },
      )
    }),

  /**
   * Reset role password.
   * @returns Role password reset result
   */
  resetRolePassword: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/roles/{roleName}/reset-password',
      tags: ['database'],
      summary: 'Reset role password',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        roleName: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.resetRolePassword(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.roleName,
      )
    }),

  /**
   * Delete a role.
   * @returns Deletion result
   */
  deleteRole: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/roles/{roleName}',
      tags: ['database'],
      summary: 'Delete role',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        roleName: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.deleteRole(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.roleName,
      )
    }),
}
