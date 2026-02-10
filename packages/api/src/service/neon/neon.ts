import { createApiClient } from '@neondatabase/api-client'
import { ORPCError } from '@orpc/server'

import { and, asc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Neon } from '@cared/db/schema'

import type { Api } from '@neondatabase/api-client'
import { env } from '../../env'

export enum DatabaseTier {
  LOW_COST = 'low-cost',
  NORMAL = 'normal',
}

export class NeonService {
  private readonly freeTierClient: Api<unknown>
  private readonly paidTierClient: Api<unknown>

  constructor() {
    const freeApiKey = env.NEON_FREE_ORG_API_KEY
    const paidApiKey = env.NEON_PAID_ORG_API_KEY

    if (!freeApiKey) {
      throw new Error('NEON_FREE_ORG_API_KEY is required')
    }
    if (!paidApiKey) {
      throw new Error('NEON_PAID_ORG_API_KEY is required')
    }

    this.freeTierClient = createApiClient({
      apiKey: freeApiKey,
    })
    this.paidTierClient = createApiClient({
      apiKey: paidApiKey,
    })
  }

  /**
   * Get Neon API client based on tier
   */
  private getClient(tier: DatabaseTier): {
    orgId: string
    client: Api<unknown>
  } {
    switch (tier) {
      case DatabaseTier.LOW_COST: {
        const orgId = env.NEON_FREE_ORG_ID
        if (!orgId) {
          throw new Error('NEON_FREE_ORG_ID is required')
        }
        return { orgId, client: this.freeTierClient }
      }
      case DatabaseTier.NORMAL: {
        const orgId = env.NEON_PAID_ORG_ID
        if (!orgId) {
          throw new Error('NEON_PAID_ORG_ID is required')
        }
        return { orgId, client: this.paidTierClient }
      }
    }
  }

  /**
   * Format namespace by removing internal IDs
   */
  formatNamespace(namespace: Neon): Omit<Neon, 'accountId' | 'orgId' | 'projectId'> {
    const { accountId: _accountId, orgId: _orgId, projectId: _projectId, ...rest } = namespace
    return rest
  }

  /**
   * List all database namespaces for an account
   */
  async listNamespaces(accountId: string) {
    const namespaces = await db
      .select()
      .from(Neon)
      .where(eq(Neon.accountId, accountId))
      .orderBy(asc(Neon.id))

    return {
      namespaces: namespaces.map((ns) => this.formatNamespace(ns)),
    }
  }

  /**
   * Get a single database namespace by ID
   */
  async getNamespace(accountId: string, id: string) {
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, id), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    return {
      namespace: this.formatNamespace(namespace),
    }
  }

  /**
   * Create a new database namespace (Neon project)
   */
  async createNamespace(
    accountId: string,
    params: {
      name: string
      tier: DatabaseTier
      regionId: string
      pgVersion: number
      settings?: {
        activeTimeSeconds?: number
        logicalSizeBytes?: number
        dataTransferBytes?: number
        autoscalingLimitMinCu?: number
        autoscalingLimitMaxCu?: number
        suspendTimeoutSeconds?: number | -1
      }
    },
  ) {
    const { orgId, client } = this.getClient(params.tier)

    // Create project in Neon
    const projectResponse = await client.createProject({
      project: {
        name: params.name,
        org_id: orgId,
        region_id: params.regionId,
        pg_version: params.pgVersion,
        branch: {
          database_name: 'cared',
        },
        settings: {
          quota:
            params.tier === DatabaseTier.LOW_COST
              ? {
                  active_time_seconds: 360000,
                  logical_size_bytes: 536870912,
                  data_transfer_bytes: 5368709120,
                }
              : {
                  active_time_seconds: params.settings?.activeTimeSeconds ?? 2700000,
                  logical_size_bytes: params.settings?.logicalSizeBytes ?? 10737418240,
                  data_transfer_bytes: params.settings?.dataTransferBytes ?? 53687091200,
                },
        },
        default_endpoint_settings:
          params.tier === DatabaseTier.LOW_COST
            ? {
                autoscaling_limit_min_cu: 0.25,
                autoscaling_limit_max_cu: 2,
                suspend_timeout_seconds: 300,
              }
            : {
                autoscaling_limit_min_cu: params.settings?.autoscalingLimitMinCu ?? 0.25,
                autoscaling_limit_max_cu: params.settings?.autoscalingLimitMaxCu ?? 16,
                suspend_timeout_seconds: params.settings?.suspendTimeoutSeconds ?? 300,
              },
      },
    })

    const project = projectResponse.data.project

    // Store metadata in database
    const [namespace] = await db
      .insert(Neon)
      .values({
        accountId,
        name: params.name,
        isLowCost: params.tier === DatabaseTier.LOW_COST,
        orgId: orgId,
        projectId: project.id,
        regionId: project.region_id,
      })
      .returning()

    if (!namespace) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to create database namespace',
      })
    }

    return {
      namespace: this.formatNamespace(namespace),
      project,
    }
  }

  /**
   * Update a database namespace
   */
  async updateNamespace(accountId: string, id: string, params: { name?: string }) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, id), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Update project in Neon if name is provided
    if (params.name) {
      await client.updateProject(namespace.projectId, {
        project: {
          name: params.name,
        },
      })
    }

    // Update metadata in database
    const [updatedNamespace] = await db
      .update(Neon)
      .set({
        name: params.name ?? namespace.name,
      })
      .where(eq(Neon.id, id))
      .returning()

    if (!updatedNamespace) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to update database namespace',
      })
    }

    return {
      namespace: this.formatNamespace(updatedNamespace),
    }
  }

  /**
   * Delete a database namespace (Neon project)
   */
  async deleteNamespace(accountId: string, id: string) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, id), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Delete project in Neon
    await client.deleteProject(namespace.projectId)

    // Delete metadata from database
    await db.delete(Neon).where(eq(Neon.id, id))
  }

  /**
   * List all branches for a database namespace
   */
  async listBranches(
    accountId: string,
    namespaceId: string,
    params: {
      search?: string
      limit?: number
      cursor?: string
    },
  ) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // List branches from Neon
    const branchesResponse = await client.listProjectBranches({
      projectId: namespace.projectId,
      search: params.search,
      limit: params.limit,
      cursor: params.cursor,
      sort_by: 'created_at',
      sort_order: 'asc',
    })

    return {
      branches: branchesResponse.data.branches,
      pagination: branchesResponse.data.pagination,
    }
  }

  /**
   * Get a single branch by ID
   */
  async getBranch(accountId: string, namespaceId: string, branchId: string) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Get branch from Neon
    const branchResponse = await client.getProjectBranch(namespace.projectId, branchId)

    return {
      branch: branchResponse.data.branch,
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(
    accountId: string,
    namespaceId: string,
    params: {
      name?: string
      parentId?: string
      parentLsn?: string
      parentTimestamp?: string
      protected?: boolean
    },
  ) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Create branch in Neon
    const branchResponse = await client.createProjectBranch(namespace.projectId, {
      branch: {
        name: params.name,
        parent_id: params.parentId,
        parent_lsn: params.parentLsn,
        parent_timestamp: params.parentTimestamp,
        protected: params.protected,
      },
    })

    return {
      branch: branchResponse.data.branch,
      endpoints: branchResponse.data.endpoints,
    }
  }

  /**
   * Update a branch
   */
  async updateBranch(
    accountId: string,
    namespaceId: string,
    branchId: string,
    params: {
      name?: string
      protected?: boolean
    },
  ) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Update branch in Neon
    const branchResponse = await client.updateProjectBranch(namespace.projectId, branchId, {
      branch: {
        name: params.name,
        protected: params.protected,
      },
    })

    return {
      branch: branchResponse.data.branch,
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(accountId: string, namespaceId: string, branchId: string) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Delete branch in Neon
    const branchResponse = await client.deleteProjectBranch(namespace.projectId, branchId)

    return {
      branch: branchResponse.data.branch,
    }
  }

  /**
   * List all databases for a branch
   */
  async listDatabases(accountId: string, namespaceId: string, branchId: string) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // List databases from Neon
    const databasesResponse = await client.listProjectBranchDatabases(namespace.projectId, branchId)

    return {
      databases: databasesResponse.data.databases,
    }
  }

  /**
   * Get a single database by name
   */
  async getDatabase(
    accountId: string,
    namespaceId: string,
    branchId: string,
    databaseName: string,
  ) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Get database from Neon
    const databaseResponse = await client.getProjectBranchDatabase(
      namespace.projectId,
      branchId,
      databaseName,
    )

    return {
      database: databaseResponse.data.database,
    }
  }

  /**
   * Create a new database
   */
  async createDatabase(
    accountId: string,
    namespaceId: string,
    branchId: string,
    params: {
      name: string
      ownerName?: string
    },
  ) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Create database in Neon
    // owner_name is required by API, use provided value or default role name
    const databaseResponse = await client.createProjectBranchDatabase(
      namespace.projectId,
      branchId,
      {
        database: {
          name: params.name,
          owner_name: params.ownerName ?? `${params.name}_owner`,
        },
      },
    )

    return {
      database: databaseResponse.data.database,
    }
  }

  /**
   * Update a database
   */
  async updateDatabase(
    accountId: string,
    namespaceId: string,
    branchId: string,
    databaseName: string,
    params: {
      name?: string
      ownerName?: string
    },
  ) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Update database in Neon
    const databaseResponse = await client.updateProjectBranchDatabase(
      namespace.projectId,
      branchId,
      databaseName,
      {
        database: {
          ...(params.name && { name: params.name }),
          ...(params.ownerName && { owner_name: params.ownerName }),
        },
      },
    )

    return {
      database: databaseResponse.data.database,
    }
  }

  /**
   * Delete a database
   */
  async deleteDatabase(
    accountId: string,
    namespaceId: string,
    branchId: string,
    databaseName: string,
  ) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Delete database in Neon
    const databaseResponse = await client.deleteProjectBranchDatabase(
      namespace.projectId,
      branchId,
      databaseName,
    )

    return {
      database: databaseResponse.data.database,
    }
  }

  /**
   * List all roles for a branch
   */
  async listRoles(accountId: string, namespaceId: string, branchId: string) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // List roles from Neon
    const rolesResponse = await client.listProjectBranchRoles(namespace.projectId, branchId)

    return {
      roles: rolesResponse.data.roles,
    }
  }

  /**
   * Get a single role by name
   */
  async getRole(accountId: string, namespaceId: string, branchId: string, roleName: string) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Get role from Neon
    const roleResponse = await client.getProjectBranchRole(namespace.projectId, branchId, roleName)

    return {
      role: roleResponse.data.role,
    }
  }

  /**
   * Get role password
   */
  async getRolePassword(
    accountId: string,
    namespaceId: string,
    branchId: string,
    roleName: string,
  ) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Get role password from Neon
    const passwordResponse = await client.getProjectBranchRolePassword(
      namespace.projectId,
      branchId,
      roleName,
    )

    return {
      password: passwordResponse.data.password,
    }
  }

  /**
   * Create a new role
   */
  async createRole(
    accountId: string,
    namespaceId: string,
    branchId: string,
    params: {
      name: string
      noLogin?: boolean
    },
  ) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Create role in Neon
    const roleResponse = await client.createProjectBranchRole(namespace.projectId, branchId, {
      role: {
        name: params.name,
        no_login: params.noLogin,
      },
    })

    return {
      role: roleResponse.data.role,
    }
  }

  /**
   * Reset role password
   */
  async resetRolePassword(
    accountId: string,
    namespaceId: string,
    branchId: string,
    roleName: string,
  ) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Reset role password in Neon
    const roleResponse = await client.resetProjectBranchRolePassword(
      namespace.projectId,
      branchId,
      roleName,
    )

    return {
      role: roleResponse.data.role,
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(accountId: string, namespaceId: string, branchId: string, roleName: string) {
    // Get namespace from database
    const [namespace] = await db
      .select()
      .from(Neon)
      .where(and(eq(Neon.id, namespaceId), eq(Neon.accountId, accountId)))
      .limit(1)

    if (!namespace) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Database namespace not found',
      })
    }

    // Determine client tier based on isLowCost
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    // Delete role in Neon
    const roleResponse = await client.deleteProjectBranchRole(
      namespace.projectId,
      branchId,
      roleName,
    )

    return {
      role: roleResponse.data.role,
    }
  }
}

export const neonService = new NeonService()
