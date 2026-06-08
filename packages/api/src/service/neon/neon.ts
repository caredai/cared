import { createApiClient, EndpointType } from '@neondatabase/api-client'
import { neon } from '@neondatabase/serverless'
import { ORPCError } from '@orpc/server'

import { and, asc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Neon } from '@cared/db/schema'

import type {
  DatabaseDataApiSettings,
  DatabaseEndpointStatsGrouping,
  DatabaseEndpointType,
  DatabaseMaskingRule,
} from '../../types'
import type {
  Api,
  DefaultEndpointSettings,
  EndpointCreateRequest,
  EndpointUpdateRequest,
  ProjectListItem,
  ProjectQuota,
  ProjectSettingsData,
  ProjectUpdateRequest,
} from '@neondatabase/api-client'
import { env } from '../../env'
import {
  DatabaseTier,
  formatAnonymizedBranchStatus,
  formatBranch,
  formatBranchDatabase,
  formatConnectionDetails,
  formatDataApi,
  formatEndpoint,
  formatJwks,
  formatMaskingRule,
  formatNamespace,
  formatNamespaceListItem,
  formatOperation,
  formatRole,
  toNeonDataApiSettings,
  toNeonMaskingRule,
} from '../../types'
import { countProjectsBranches, formatEndpointStatsChart, getEndpointStats } from './api'

export interface NeonSettings {
  activeTimeSeconds?: number
  logicalSizeBytes?: number
  dataTransferBytes?: number
  autoscalingLimitMinCu?: number
  autoscalingLimitMaxCu?: number
  /** `-1` means never suspend (Neon `suspend_timeout_seconds`). */
  suspendTimeoutSeconds?: number
  /** Maps to `project.settings.enable_logical_replication` (cannot be disabled once enabled). */
  enableLogicalReplication?: boolean
  /** Maps to `project.history_retention_seconds` (shared PITR retention for all branches). */
  historyRetentionSeconds?: number
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

  private async getProject(namespace: Neon) {
    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)
    const projectResponse = await client.getProject(namespace.projectId)
    return projectResponse.data.project
  }

  private async getNamespaceClient(accountId: string, namespaceId: string) {
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

    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)
    return { namespace, client }
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

    if (namespaces.length === 0) {
      return { namespaces: [] }
    }

    // Load Neon project summaries via list API (paginated), not per-project get.
    const projectById = new Map<string, ProjectListItem>()
    const ingestTierProjects = async (tier: DatabaseTier) => {
      const { orgId, client } = this.getClient(tier)
      let cursor: string | undefined
      for (;;) {
        const res = await client.listProjects({
          org_id: orgId,
          search: accountId,
          limit: 400,
          cursor,
        })
        if (!res.data.projects.length) {
          break
        }
        for (const p of res.data.projects) {
          projectById.set(p.id, p)
        }
        cursor = res.data.pagination?.cursor
        if (!cursor) {
          break
        }
      }
    }

    await Promise.all([
      namespaces.some((n) => n.isLowCost)
        ? ingestTierProjects(DatabaseTier.LOW_COST)
        : Promise.resolve(),
      namespaces.some((n) => !n.isLowCost)
        ? ingestTierProjects(DatabaseTier.NORMAL)
        : Promise.resolve(),
    ])

    const loadBranchCounts = async (tier: DatabaseTier, projectIds: string[]) => {
      if (projectIds.length === 0) {
        return {} as Record<string, number>
      }
      const { client } = this.getClient(tier)
      return countProjectsBranches(client, projectIds)
    }

    const [lowCostBranchCounts, normalBranchCounts] = await Promise.all([
      loadBranchCounts(
        DatabaseTier.LOW_COST,
        namespaces.filter((n) => n.isLowCost).map((n) => n.projectId),
      ),
      loadBranchCounts(
        DatabaseTier.NORMAL,
        namespaces.filter((n) => !n.isLowCost).map((n) => n.projectId),
      ),
    ])

    const branchCountByProjectId = new Map<string, number>([
      ...Object.entries(lowCostBranchCounts),
      ...Object.entries(normalBranchCounts),
    ])

    const namespacesWithProjects = namespaces.map((ns) => {
      const listed = projectById.get(ns.projectId)
      if (!listed) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: `Neon project not found for database namespace ${ns.id} (projectId: ${ns.projectId})`,
        })
      }
      return formatNamespaceListItem(ns, listed, branchCountByProjectId.get(ns.projectId) ?? 0)
    })

    return {
      namespaces: namespacesWithProjects,
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

    const project = await this.getProject(namespace)

    return {
      namespace: formatNamespace(namespace, project),
    }
  }

  /**
   * Count branches for a database namespace.
   */
  async countBranches(accountId: string, namespaceId: string) {
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

    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    const response = await client.countProjectBranches({ projectId: namespace.projectId })

    return {
      count: response.data.count,
    }
  }

  /**
   * List compute endpoints for a database namespace.
   */
  async listEndpoints(accountId: string, namespaceId: string) {
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

    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    const response = await client.listProjectEndpoints(namespace.projectId)

    return {
      endpoints: response.data.endpoints.map(formatEndpoint),
    }
  }

  /**
   * List compute endpoints for a single branch.
   */
  async listBranchEndpoints(accountId: string, namespaceId: string, branchId: string) {
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

    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    const response = await client.listProjectBranchEndpoints(namespace.projectId, branchId)

    return {
      endpoints: response.data.endpoints.map(formatEndpoint),
    }
  }

  /**
   * Create a compute endpoint for a branch.
   */
  async createEndpoint(
    accountId: string,
    namespaceId: string,
    params: {
      branchId: string
      type: DatabaseEndpointType
      name?: string
      autoscalingLimitMinCu?: number
      autoscalingLimitMaxCu?: number
      suspendTimeoutSeconds?: number
      disabled?: boolean
    },
  ) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)

    const endpoint: EndpointCreateRequest['endpoint'] = {
      branch_id: params.branchId,
      type: params.type === 'read_write' ? EndpointType.ReadWrite : EndpointType.ReadOnly,
      region_id: namespace.regionId,
      name: params.name,
      autoscaling_limit_min_cu: params.autoscalingLimitMinCu,
      autoscaling_limit_max_cu: params.autoscalingLimitMaxCu,
      suspend_timeout_seconds: params.suspendTimeoutSeconds,
      disabled: params.disabled,
    }

    const response = await client.createProjectEndpoint(namespace.projectId, { endpoint })

    return {
      endpoint: formatEndpoint(response.data.endpoint),
      operations: response.data.operations.map(formatOperation),
    }
  }

  /**
   * Update compute endpoint settings.
   */
  async updateEndpoint(
    accountId: string,
    namespaceId: string,
    endpointId: string,
    params: {
      name?: string
      autoscalingLimitMinCu?: number
      autoscalingLimitMaxCu?: number
      suspendTimeoutSeconds?: number
      disabled?: boolean
    },
  ) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)

    const endpoint: EndpointUpdateRequest['endpoint'] = {
      name: params.name,
      autoscaling_limit_min_cu: params.autoscalingLimitMinCu,
      autoscaling_limit_max_cu: params.autoscalingLimitMaxCu,
      suspend_timeout_seconds: params.suspendTimeoutSeconds,
      disabled: params.disabled,
    }

    const response = await client.updateProjectEndpoint(namespace.projectId, endpointId, {
      endpoint,
    })

    return {
      endpoint: formatEndpoint(response.data.endpoint),
      operations: response.data.operations.map(formatOperation),
    }
  }

  async deleteEndpoint(accountId: string, namespaceId: string, endpointId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.deleteProjectEndpoint(namespace.projectId, endpointId)

    return {
      endpoint: formatEndpoint(response.data.endpoint),
      operations: response.data.operations.map(formatOperation),
    }
  }

  async startEndpoint(accountId: string, namespaceId: string, endpointId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.startProjectEndpoint(namespace.projectId, endpointId)

    return {
      endpoint: formatEndpoint(response.data.endpoint),
      operations: response.data.operations.map(formatOperation),
    }
  }

  async suspendEndpoint(accountId: string, namespaceId: string, endpointId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.suspendProjectEndpoint(namespace.projectId, endpointId)

    return {
      endpoint: formatEndpoint(response.data.endpoint),
      operations: response.data.operations.map(formatOperation),
    }
  }

  async restartEndpoint(accountId: string, namespaceId: string, endpointId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.restartProjectEndpoint(namespace.projectId, endpointId)

    return {
      endpoint: formatEndpoint(response.data.endpoint),
      operations: response.data.operations.map(formatOperation),
    }
  }

  /**
   * Time-series monitoring stats for a compute endpoint (allocated CU and RAM usage).
   */
  async getEndpointStats(
    accountId: string,
    namespaceId: string,
    params: {
      endpointId: string
      from?: string
      to?: string
      grouping?: DatabaseEndpointStatsGrouping
    },
  ) {
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

    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    const to = params.to ?? new Date().toISOString()
    const from = params.from ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const response = await getEndpointStats(client, namespace.projectId, params.endpointId, {
      from,
      to,
      grouping: params.grouping ?? '10min',
      metrics: ['cpu_provisioned_cores', 'ram_consumed_bytes'],
    })

    return {
      points: formatEndpointStatsChart(response),
      from: new Date(from),
      to: new Date(to),
      grouping: params.grouping ?? '10min',
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
      settings?: NeonSettings
    },
  ) {
    const { orgId, client } = this.getClient(params.tier)
    const s = params.settings

    const quota: ProjectQuota =
      params.tier === DatabaseTier.LOW_COST
        ? {
            active_time_seconds: 360000,
            logical_size_bytes: 536870912,
            data_transfer_bytes: 5368709120,
          }
        : {
            active_time_seconds: s?.activeTimeSeconds ?? 2700000,
            logical_size_bytes: s?.logicalSizeBytes ?? 10737418240,
            data_transfer_bytes: s?.dataTransferBytes ?? 53687091200,
          }

    const projectSettings: ProjectSettingsData = { quota }
    if (s?.enableLogicalReplication !== undefined) {
      projectSettings.enable_logical_replication = s.enableLogicalReplication
    }

    const defaultEndpointSettings: DefaultEndpointSettings =
      params.tier === DatabaseTier.LOW_COST
        ? {
            autoscaling_limit_min_cu: 0.25,
            autoscaling_limit_max_cu: 2,
            suspend_timeout_seconds: 0, // 0 means use the default value 300
          }
        : {
            autoscaling_limit_min_cu: s?.autoscalingLimitMinCu ?? 0.25,
            autoscaling_limit_max_cu: s?.autoscalingLimitMaxCu ?? 16,
            suspend_timeout_seconds: s?.suspendTimeoutSeconds ?? 0, // 0 means use the default value 300
          }

    // Create project in Neon
    const projectResponse = await client.createProject({
      project: {
        // Neon project name is the Cared account id so org-level list/search can target this account.
        name: accountId,
        org_id: orgId,
        region_id: params.regionId,
        pg_version: params.pgVersion,
        ...(s?.historyRetentionSeconds !== undefined && {
          history_retention_seconds: s.historyRetentionSeconds,
        }),
        branch: {
          name: 'production',
          database_name: 'cared',
          role_name: 'cared',
        },
        settings: projectSettings,
        default_endpoint_settings: defaultEndpointSettings,
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
      namespace: formatNamespace(namespace, project),
    }
  }

  /**
   * Update a database namespace
   */
  async updateNamespace(
    accountId: string,
    id: string,
    params: { name?: string; settings?: Partial<NeonSettings> },
  ) {
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

    const neonUpdate: NonNullable<ProjectUpdateRequest['project']> = {}
    const s = params.settings
    if (s) {
      if (s.historyRetentionSeconds !== undefined) {
        neonUpdate.history_retention_seconds = s.historyRetentionSeconds
      }

      const quotaPatch: ProjectQuota = {}
      if (s.activeTimeSeconds !== undefined) {
        quotaPatch.active_time_seconds = s.activeTimeSeconds
      }
      if (s.logicalSizeBytes !== undefined) {
        quotaPatch.logical_size_bytes = s.logicalSizeBytes
      }
      if (s.dataTransferBytes !== undefined) {
        quotaPatch.data_transfer_bytes = s.dataTransferBytes
      }

      const settingsPayload: ProjectSettingsData = {}
      if (Object.keys(quotaPatch).length > 0) {
        settingsPayload.quota = quotaPatch
      }
      if (s.enableLogicalReplication !== undefined) {
        settingsPayload.enable_logical_replication = s.enableLogicalReplication
      }
      if (Object.keys(settingsPayload).length > 0) {
        neonUpdate.settings = settingsPayload
      }

      const endpointPatch: DefaultEndpointSettings = {}
      if (s.autoscalingLimitMinCu !== undefined) {
        endpointPatch.autoscaling_limit_min_cu = s.autoscalingLimitMinCu
      }
      if (s.autoscalingLimitMaxCu !== undefined) {
        endpointPatch.autoscaling_limit_max_cu = s.autoscalingLimitMaxCu
      }
      if (s.suspendTimeoutSeconds !== undefined) {
        endpointPatch.suspend_timeout_seconds = s.suspendTimeoutSeconds
      }
      if (Object.keys(endpointPatch).length > 0) {
        neonUpdate.default_endpoint_settings = endpointPatch
      }
    }

    if (Object.keys(neonUpdate).length > 0) {
      await client.updateProject(namespace.projectId, {
        project: neonUpdate,
      })
    }

    // Display name is Cared-only; Neon project name stays `accountId`.
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

    const project = await this.getProject(updatedNamespace)

    return {
      namespace: formatNamespace(updatedNamespace, project),
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

    const nextCursor = branchesResponse.data.pagination?.next

    return {
      branches: branchesResponse.data.branches.map(formatBranch),
      hasMore: Boolean(nextCursor),
      cursor: nextCursor,
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
      branch: formatBranch(branchResponse.data.branch),
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
      branch: formatBranch(branchResponse.data.branch),
      endpoints: branchResponse.data.endpoints.map(formatEndpoint),
      operations: branchResponse.data.operations.map(formatOperation),
      roles: branchResponse.data.roles.map(formatRole),
      databases: branchResponse.data.databases.map(formatBranchDatabase),
      connectionUris: branchResponse.data.connection_uris?.map(formatConnectionDetails),
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
      branch: formatBranch(branchResponse.data.branch),
    }
  }

  /**
   * Set a branch as the namespace default branch.
   */
  async setDefaultBranch(accountId: string, namespaceId: string, branchId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)

    const branchResponse = await client.setDefaultProjectBranch(namespace.projectId, branchId)

    return {
      branch: formatBranch(branchResponse.data.branch),
      operations: branchResponse.data.operations.map(formatOperation),
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
      branch: formatBranch(branchResponse.data.branch),
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
      databases: databasesResponse.data.databases.map(formatBranchDatabase),
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
      database: formatBranchDatabase(databaseResponse.data.database),
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

    // Neon requires owner_name; default to the database name when omitted.
    const databaseResponse = await client.createProjectBranchDatabase(
      namespace.projectId,
      branchId,
      {
        database: {
          name: params.name,
          owner_name: params.ownerName ?? params.name,
        },
      },
    )

    return {
      database: formatBranchDatabase(databaseResponse.data.database),
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
      database: formatBranchDatabase(databaseResponse.data.database),
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
      database: formatBranchDatabase(databaseResponse.data.database),
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
      roles: rolesResponse.data.roles.map(formatRole),
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
      role: formatRole(roleResponse.data.role),
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
      role: formatRole(roleResponse.data.role),
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
      role: formatRole(roleResponse.data.role),
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
      role: formatRole(roleResponse.data.role),
    }
  }

  async getMaskingRules(accountId: string, namespaceId: string, branchId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.getMaskingRules(namespace.projectId, branchId)

    return {
      maskingRules: response.data.masking_rules.map(formatMaskingRule),
    }
  }

  async updateMaskingRules(
    accountId: string,
    namespaceId: string,
    branchId: string,
    maskingRules: DatabaseMaskingRule[],
  ) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.updateMaskingRules(namespace.projectId, branchId, {
      masking_rules: maskingRules.map(toNeonMaskingRule),
    })

    return {
      maskingRules: response.data.masking_rules.map(formatMaskingRule),
    }
  }

  async getAnonymizedBranchStatus(accountId: string, namespaceId: string, branchId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.getAnonymizedBranchStatus(namespace.projectId, branchId)

    return {
      status: formatAnonymizedBranchStatus(response.data),
    }
  }

  async startAnonymization(accountId: string, namespaceId: string, branchId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.startAnonymization(namespace.projectId, branchId)

    return {
      status: formatAnonymizedBranchStatus(response.data),
    }
  }

  async listBranchDataApis(accountId: string, namespaceId: string, branchId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const databasesResponse = await client.listProjectBranchDatabases(namespace.projectId, branchId)

    const dataApis = await Promise.all(
      databasesResponse.data.databases.map(async (database) => {
        try {
          const response = await client.getProjectBranchDataApi(
            namespace.projectId,
            branchId,
            database.name,
          )
          return formatDataApi(database.name, response.data)
        } catch {
          return {
            databaseName: database.name,
            enabled: false,
          }
        }
      }),
    )

    return { dataApis }
  }

  async getBranchDataApi(
    accountId: string,
    namespaceId: string,
    branchId: string,
    databaseName: string,
  ) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)

    try {
      const response = await client.getProjectBranchDataApi(
        namespace.projectId,
        branchId,
        databaseName,
      )
      return { dataApi: formatDataApi(databaseName, response.data) }
    } catch {
      return {
        dataApi: {
          databaseName,
          enabled: false,
        },
      }
    }
  }

  async updateBranchDataApi(
    accountId: string,
    namespaceId: string,
    branchId: string,
    databaseName: string,
    settings: DatabaseDataApiSettings,
  ) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    await client.updateProjectBranchDataApi(namespace.projectId, branchId, databaseName, {
      settings: toNeonDataApiSettings(settings),
    })

    const response = await client.getProjectBranchDataApi(
      namespace.projectId,
      branchId,
      databaseName,
    )

    return { dataApi: formatDataApi(databaseName, response.data) }
  }

  async getBranchNeonAuth(accountId: string, namespaceId: string, branchId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)

    try {
      const response = await client.getNeonAuth(namespace.projectId, branchId)
      return {
        neonAuth: {
          ready: true,
          authProvider: response.data.auth_provider,
          baseUrl: response.data.base_url,
          dbName: response.data.db_name,
        },
      }
    } catch {
      return {
        neonAuth: {
          ready: false,
        },
      }
    }
  }

  /**
   * Run a read-only SQL query against a branch database via the serverless driver.
   */
  async executeBranchSql(
    accountId: string,
    namespaceId: string,
    branchId: string,
    databaseName: string,
    query: string,
  ) {
    assertReadOnlySql(query)

    const connectionUri = await this.getBranchDatabaseConnectionUri(
      accountId,
      namespaceId,
      branchId,
      databaseName,
    )
    const sql = neon(connectionUri)
    const rows = await sql.query(query, [])

    return { rows: rows as Record<string, unknown>[] }
  }

  async createBranchDataApi(
    accountId: string,
    namespaceId: string,
    branchId: string,
    databaseName: string,
  ) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    await client.createProjectBranchDataApi(namespace.projectId, branchId, databaseName, {
      auth_provider: 'external',
      settings: {
        db_schemas: ['public'],
        db_anon_role: 'anonymous',
        openapi_mode: 'disabled',
      },
    })

    const dataApiResponse = await client.getProjectBranchDataApi(
      namespace.projectId,
      branchId,
      databaseName,
    )

    return {
      dataApi: formatDataApi(databaseName, dataApiResponse.data),
    }
  }

  async deleteBranchDataApi(
    accountId: string,
    namespaceId: string,
    branchId: string,
    databaseName: string,
  ) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    await client.deleteProjectBranchDataApi(namespace.projectId, branchId, databaseName)

    return {
      dataApi: {
        databaseName,
        enabled: false,
      },
    }
  }

  async listJwks(accountId: string, namespaceId: string, branchId?: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.getProjectJwks(namespace.projectId)

    return {
      jwks: response.data.jwks
        .filter((jwks) => !branchId || !jwks.branch_id || jwks.branch_id === branchId)
        .map(formatJwks),
    }
  }

  async addJwks(
    accountId: string,
    namespaceId: string,
    params: {
      providerName: string
      jwksUrl: string
      branchId?: string
      jwtAudience?: string
    },
  ) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.addProjectJwks(namespace.projectId, {
      provider_name: params.providerName,
      jwks_url: params.jwksUrl,
      branch_id: params.branchId,
      jwt_audience: params.jwtAudience,
    })

    return {
      jwks: formatJwks(response.data.jwks),
      operations: response.data.operations.map(formatOperation),
    }
  }

  async deleteJwks(accountId: string, namespaceId: string, jwksId: string) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const response = await client.deleteProjectJwks(namespace.projectId, jwksId)

    return {
      jwks: formatJwks(response.data),
    }
  }

  /**
   * List Postgres connection URIs for every database on a branch.
   */
  async listConnectionUris(accountId: string, namespaceId: string, branchId: string) {
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

    const tier = namespace.isLowCost ? DatabaseTier.LOW_COST : DatabaseTier.NORMAL
    const { client } = this.getClient(tier)

    const databasesResponse = await client.listProjectBranchDatabases(namespace.projectId, branchId)

    const connectionUris = await Promise.all(
      databasesResponse.data.databases.map(async (database) => {
        const uriResponse = await client.getConnectionUri({
          projectId: namespace.projectId,
          branch_id: branchId,
          database_name: database.name,
          role_name: database.owner_name,
        })

        return {
          name: database.name,
          url: uriResponse.data.uri,
        }
      }),
    )

    return { connectionUris }
  }

  private async getBranchDatabaseConnectionUri(
    accountId: string,
    namespaceId: string,
    branchId: string,
    databaseName: string,
  ) {
    const { namespace, client } = await this.getNamespaceClient(accountId, namespaceId)
    const databasesResponse = await client.listProjectBranchDatabases(namespace.projectId, branchId)
    const database = databasesResponse.data.databases.find((entry) => entry.name === databaseName)

    if (!database) {
      throw new ORPCError('NOT_FOUND', {
        message: `Database "${databaseName}" not found on this branch`,
      })
    }

    const uriResponse = await client.getConnectionUri({
      projectId: namespace.projectId,
      branch_id: branchId,
      database_name: databaseName,
      role_name: database.owner_name,
    })

    return uriResponse.data.uri
  }
}

function assertReadOnlySql(query: string) {
  const normalized = query.trim().replace(/\s+/g, ' ')

  if (!/^select\b/i.test(normalized)) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Only SELECT queries are allowed',
    })
  }

  if (normalized.includes(';')) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Multiple SQL statements are not allowed',
    })
  }
}

export const neonService = new NeonService()
