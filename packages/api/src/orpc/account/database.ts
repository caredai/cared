import { z } from 'zod/v4'

import { protectedProcedure } from '../../orpc'
import { neonService } from '../../service/neon/neon'
import { ALLOWED_DATABASE_REGIONS, DatabaseTier } from '../../types'

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
   * Count branches for a database namespace.
   * @returns Branch count
   */
  countBranches: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/count',
      tags: ['database'],
      summary: 'Count branches',
    })
    .input(
      z.object({
        namespaceId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.countBranches(context.auth.accountId, input.namespaceId)
    }),

  /**
   * List compute endpoints for a database namespace.
   * @returns List of endpoints
   */
  listEndpoints: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/endpoints',
      tags: ['database'],
      summary: 'List compute endpoints',
    })
    .input(
      z.object({
        namespaceId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.listEndpoints(context.auth.accountId, input.namespaceId)
    }),

  /**
   * List compute endpoints for a branch.
   * @returns Endpoints on the branch
   */
  listBranchEndpoints: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/endpoints',
      tags: ['database'],
      summary: 'List branch endpoints',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.listBranchEndpoints(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
      )
    }),

  /**
   * Get time-series monitoring stats for a compute endpoint.
   * @returns Allocated CU and RAM usage over time
   */
  getEndpointStats: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/endpoints/{endpointId}/stats',
      tags: ['database'],
      summary: 'Get endpoint monitoring stats',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        endpointId: z.string(),
        from: z.iso.datetime().optional(),
        to: z.iso.datetime().optional(),
        grouping: z.enum(['1min', '5min', '10min', '1hour', '1day']).default('10min'),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.getEndpointStats(context.auth.accountId, input.namespaceId, {
        endpointId: input.endpointId,
        from: input.from,
        to: input.to,
        grouping: input.grouping,
      })
    }),

  /**
   * Create a compute endpoint for a branch.
   * @returns Created endpoint and Neon operations
   */
  createEndpoint: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/endpoints',
      tags: ['database'],
      summary: 'Create compute endpoint',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        type: z.enum(['read_write', 'read_only']),
        name: z.string().min(1).max(64).optional(),
        autoscalingLimitMinCu: z.number().min(0.25).optional(),
        autoscalingLimitMaxCu: z.number().min(0.25).optional(),
        suspendTimeoutSeconds: z.union([z.literal(-1), z.int().min(60).max(604800)]).optional(),
        disabled: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.createEndpoint(context.auth.accountId, input.namespaceId, {
        branchId: input.branchId,
        type: input.type,
        name: input.name,
        autoscalingLimitMinCu: input.autoscalingLimitMinCu,
        autoscalingLimitMaxCu: input.autoscalingLimitMaxCu,
        suspendTimeoutSeconds: input.suspendTimeoutSeconds,
        disabled: input.disabled,
      })
    }),

  /**
   * Update a compute endpoint.
   * @returns Updated endpoint and Neon operations
   */
  updateEndpoint: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/database-namespaces/{namespaceId}/endpoints/{endpointId}',
      tags: ['database'],
      summary: 'Update compute endpoint',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        endpointId: z.string(),
        name: z.string().min(1).max(64).optional(),
        autoscalingLimitMinCu: z.number().min(0.25).optional(),
        autoscalingLimitMaxCu: z.number().min(0.25).optional(),
        suspendTimeoutSeconds: z.union([z.literal(-1), z.int().min(60).max(604800)]).optional(),
        disabled: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.updateEndpoint(
        context.auth.accountId,
        input.namespaceId,
        input.endpointId,
        {
          name: input.name,
          autoscalingLimitMinCu: input.autoscalingLimitMinCu,
          autoscalingLimitMaxCu: input.autoscalingLimitMaxCu,
          suspendTimeoutSeconds: input.suspendTimeoutSeconds,
          disabled: input.disabled,
        },
      )
    }),

  /**
   * Delete a compute endpoint.
   * @returns Deleted endpoint and Neon operations
   */
  deleteEndpoint: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/database-namespaces/{namespaceId}/endpoints/{endpointId}',
      tags: ['database'],
      summary: 'Delete compute endpoint',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        endpointId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.deleteEndpoint(
        context.auth.accountId,
        input.namespaceId,
        input.endpointId,
      )
    }),

  startEndpoint: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/endpoints/{endpointId}/start',
      tags: ['database'],
      summary: 'Start compute endpoint',
    })
    .input(z.object({ namespaceId: z.string(), endpointId: z.string() }))
    .handler(async ({ context, input }) => {
      return await neonService.startEndpoint(
        context.auth.accountId,
        input.namespaceId,
        input.endpointId,
      )
    }),

  suspendEndpoint: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/endpoints/{endpointId}/suspend',
      tags: ['database'],
      summary: 'Suspend compute endpoint',
    })
    .input(z.object({ namespaceId: z.string(), endpointId: z.string() }))
    .handler(async ({ context, input }) => {
      return await neonService.suspendEndpoint(
        context.auth.accountId,
        input.namespaceId,
        input.endpointId,
      )
    }),

  restartEndpoint: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/endpoints/{endpointId}/restart',
      tags: ['database'],
      summary: 'Restart compute endpoint',
    })
    .input(z.object({ namespaceId: z.string(), endpointId: z.string() }))
    .handler(async ({ context, input }) => {
      return await neonService.restartEndpoint(
        context.auth.accountId,
        input.namespaceId,
        input.endpointId,
      )
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
        tier: z.enum(DatabaseTier),
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
            // Neon `project.settings.enable_logical_replication` (irreversible once enabled).
            enableLogicalReplication: z.boolean().optional(),
            // Neon `project.history_retention_seconds` (PITR window for all branches).
            historyRetentionSeconds: z.number().int().min(0).max(2592000).optional(),
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
        // Display name is stored in Cared only; Neon project name remains the account id.
        name: z.string().min(1).optional(),
        settings: z
          .object({
            activeTimeSeconds: z.int().optional(),
            logicalSizeBytes: z.int().optional(),
            dataTransferBytes: z.int().optional(),
            autoscalingLimitMinCu: z.number().min(0.25).optional(),
            autoscalingLimitMaxCu: z.number().max(16).optional(),
            suspendTimeoutSeconds: z.union([z.literal(-1), z.int().min(60).max(604800)]).optional(),
            enableLogicalReplication: z.boolean().optional(),
            historyRetentionSeconds: z.number().int().min(0).max(2592000).optional(),
          })
          .optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.updateNamespace(context.auth.accountId, input.id, {
        name: input.name,
        settings: input.settings,
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
   * Set a branch as the default branch.
   * @returns Updated branch and Neon operations
   */
  setDefaultBranch: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/set-default',
      tags: ['database'],
      summary: 'Set branch as default',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.setDefaultBranch(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
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
   * List Postgres connection URIs for all databases on a branch.
   * @returns Database names and connection URLs
   */
  listConnectionUris: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/connection-uris',
      tags: ['database'],
      summary: 'List connection URIs for all databases on a branch',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.listConnectionUris(
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

  getMaskingRules: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/masking-rules',
      tags: ['database'],
      summary: 'Get branch masking rules',
    })
    .input(z.object({ namespaceId: z.string(), branchId: z.string() }))
    .handler(async ({ context, input }) => {
      return await neonService.getMaskingRules(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
      )
    }),

  updateMaskingRules: protectedProcedure
    .route({
      method: 'PUT',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/masking-rules',
      tags: ['database'],
      summary: 'Update branch masking rules',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        maskingRules: z.array(
          z
            .object({
              databaseName: z.string().min(1),
              schemaName: z.string().min(1),
              tableName: z.string().min(1),
              columnName: z.string().min(1),
              maskingFunction: z.string().min(1).optional(),
              maskingValue: z.string().min(1).optional(),
            })
            .refine((rule) => rule.maskingFunction || rule.maskingValue, {
              message: 'Provide either a masking function or masking value',
            }),
        ),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.updateMaskingRules(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.maskingRules,
      )
    }),

  getAnonymizedBranchStatus: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/anonymized-status',
      tags: ['database'],
      summary: 'Get anonymized branch status',
    })
    .input(z.object({ namespaceId: z.string(), branchId: z.string() }))
    .handler(async ({ context, input }) => {
      return await neonService.getAnonymizedBranchStatus(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
      )
    }),

  startAnonymization: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/anonymize',
      tags: ['database'],
      summary: 'Start branch anonymization',
    })
    .input(z.object({ namespaceId: z.string(), branchId: z.string() }))
    .handler(async ({ context, input }) => {
      return await neonService.startAnonymization(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
      )
    }),

  listBranchDataApis: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/data-apis',
      tags: ['database'],
      summary: 'List branch Data APIs',
    })
    .input(z.object({ namespaceId: z.string(), branchId: z.string() }))
    .handler(async ({ context, input }) => {
      return await neonService.listBranchDataApis(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
      )
    }),

  getBranchDataApi: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/data-apis/{databaseName}',
      tags: ['database'],
      summary: 'Get branch Data API',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        databaseName: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.getBranchDataApi(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.databaseName,
      )
    }),

  updateBranchDataApi: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/data-apis/{databaseName}',
      tags: ['database'],
      summary: 'Update branch Data API settings',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        databaseName: z.string().min(1),
        settings: z.object({
          dbSchemas: z.array(z.string().min(1)).optional(),
          dbAnonRole: z.string().min(1).optional(),
          dbMaxRows: z.number().int().positive().optional(),
          serverCorsAllowedOrigins: z.string().optional(),
          openapiMode: z.string().optional(),
          serverTimingEnabled: z.boolean().optional(),
        }),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.updateBranchDataApi(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.databaseName,
        input.settings,
      )
    }),

  getBranchNeonAuth: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/neon-auth',
      tags: ['database'],
      summary: 'Get Neon Auth status for a branch',
    })
    .input(z.object({ namespaceId: z.string(), branchId: z.string() }))
    .handler(async ({ context, input }) => {
      return await neonService.getBranchNeonAuth(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
      )
    }),

  executeBranchSql: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/sql',
      tags: ['database'],
      summary: 'Execute read-only SQL on a branch database',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        databaseName: z.string().min(1),
        query: z.string().min(1).max(10_000),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.executeBranchSql(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.databaseName,
        input.query,
      )
    }),

  createBranchDataApi: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/data-apis/{databaseName}',
      tags: ['database'],
      summary: 'Create branch Data API',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        databaseName: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.createBranchDataApi(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.databaseName,
      )
    }),

  deleteBranchDataApi: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/database-namespaces/{namespaceId}/branches/{branchId}/data-apis/{databaseName}',
      tags: ['database'],
      summary: 'Delete branch Data API',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string(),
        databaseName: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.deleteBranchDataApi(
        context.auth.accountId,
        input.namespaceId,
        input.branchId,
        input.databaseName,
      )
    }),

  listJwks: protectedProcedure
    .route({
      method: 'GET',
      path: '/database-namespaces/{namespaceId}/jwks',
      tags: ['database'],
      summary: 'List JWT authentication providers',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        branchId: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.listJwks(context.auth.accountId, input.namespaceId, input.branchId)
    }),

  addJwks: protectedProcedure
    .route({
      method: 'POST',
      path: '/database-namespaces/{namespaceId}/jwks',
      tags: ['database'],
      summary: 'Add JWT authentication provider',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        providerName: z.string().min(1),
        jwksUrl: z.url(),
        branchId: z.string().optional(),
        jwtAudience: z.string().min(1).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.addJwks(context.auth.accountId, input.namespaceId, {
        providerName: input.providerName,
        jwksUrl: input.jwksUrl,
        branchId: input.branchId,
        jwtAudience: input.jwtAudience,
      })
    }),

  deleteJwks: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/database-namespaces/{namespaceId}/jwks/{jwksId}',
      tags: ['database'],
      summary: 'Delete JWT authentication provider',
    })
    .input(
      z.object({
        namespaceId: z.string(),
        jwksId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await neonService.deleteJwks(context.auth.accountId, input.namespaceId, input.jwksId)
    }),
}
