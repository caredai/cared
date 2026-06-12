import { Functions, ID, Query } from '@appwrite.io/console'

import type {
  AppwriteFunctionRegion as AppwriteFunctionRegionRow,
  AppwriteFunction as AppwriteFunctionRow,
  AppwriteRegion as AppwriteRegionRow,
} from '@cared/db/schema'
import { and, eq, inArray } from '@cared/db'
import { db } from '@cared/db/client'
import { AppwriteFunction, AppwriteFunctionRegion, AppwriteRegion } from '@cared/db/schema'

import type {
  ExecutionMethod,
  FunctionTemplateUseCase,
  Models,
  ProjectKeyScopes,
  Runtime,
  TemplateReferenceType,
  UsageRange,
  VCSReferenceType,
} from '@appwrite.io/console'
import { AppwriteService, toDate } from './base'

export interface FunctionWithRegions {
  function: AppwriteFunctionRow
  regions: AppwriteFunctionRegionRow[]
  primaryRegion: AppwriteRegionRow
}

export async function createAppwriteFunctionRecord(params: {
  functionId: string
  accountId: string
  name: string
  primaryRegionId: string
  regionIds: string[]
  activeDeploymentId?: string | null
  runtime: string
  enabled?: boolean
  metadata?: Record<string, unknown>
}) {
  return db.transaction(async (tx) => {
    const [fn] = await tx
      .insert(AppwriteFunction)
      .values({
        id: params.functionId,
        accountId: params.accountId,
        name: params.name,
        primaryRegionId: params.primaryRegionId,
        activeDeploymentId: params.activeDeploymentId,
        runtime: params.runtime,
        enabled: params.enabled ?? true,
        metadata: params.metadata ?? {},
      })
      .returning()

    if (!fn) throw new Error('Failed to create function record')

    await tx.insert(AppwriteFunctionRegion).values(
      params.regionIds.map((regionId) => ({
        functionId: fn.id,
        regionId,
        syncStatus: regionId === params.primaryRegionId ? ('ready' as const) : ('pending' as const),
        lastSyncedAt: regionId === params.primaryRegionId ? new Date() : null,
      })),
    )

    return fn
  })
}

export async function listAppwriteFunctions(accountId: string): Promise<FunctionWithRegions[]> {
  const functions = await db.query.AppwriteFunction.findMany({
    where: eq(AppwriteFunction.accountId, accountId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  })

  return Promise.all(functions.map(loadFunctionWithRegions))
}

export async function getAppwriteFunction(accountId: string, id: string) {
  const fn = await db.query.AppwriteFunction.findFirst({
    where: and(eq(AppwriteFunction.accountId, accountId), eq(AppwriteFunction.id, id)),
  })
  return fn ? loadFunctionWithRegions(fn) : undefined
}

export async function syncFunctionToRegions(functionId: string, regionIds: string[]) {
  const targetRegionIds = [...new Set(regionIds)]
  if (!targetRegionIds.length) return

  const now = new Date()
  await db
    .update(AppwriteFunctionRegion)
    .set({
      syncStatus: 'pending',
      lastSyncedAt: null,
      syncError: 'Region sync is queued until cross-region function replication is enabled.',
      updatedAt: now,
    })
    .where(
      and(
        eq(AppwriteFunctionRegion.functionId, functionId),
        inArray(AppwriteFunctionRegion.regionId, targetRegionIds),
      ),
    )
}

async function loadFunctionWithRegions(fn: AppwriteFunctionRow): Promise<FunctionWithRegions> {
  const [regions, primaryRegion] = await Promise.all([
    db.query.AppwriteFunctionRegion.findMany({
      where: eq(AppwriteFunctionRegion.functionId, fn.id),
    }),
    db.query.AppwriteRegion.findFirst({
      where: eq(AppwriteRegion.id, fn.primaryRegionId),
    }),
  ])

  if (!primaryRegion) {
    throw new Error(`Primary region not found for function ${fn.id}`)
  }

  return { function: fn, regions, primaryRegion }
}

const DEFAULT_LIST_LIMIT = 20

/** Convert Appwrite Variable to API shape: id, createdAt, updatedAt (no $ prefix, dates as Date). */
function makeVariable(v: Models.Variable) {
  return {
    id: v.$id,
    key: v.key,
    value: v.value,
    secret: v.secret,
    resourceType: v.resourceType,
    resourceId: v.resourceId,
    createdAt: toDate(v.$createdAt),
    updatedAt: toDate(v.$updatedAt),
  }
}

/** Convert Appwrite Function to API shape: id, createdAt, updatedAt, date fields as Date, vars normalized. */
function makeFunction(f: Models.Function) {
  return {
    id: f.$id,
    execute: f.execute,
    name: f.name,
    enabled: f.enabled,
    live: f.live,
    logging: f.logging,
    runtime: f.runtime,
    deploymentId: f.deploymentId,
    deploymentCreatedAt: toDate(f.deploymentCreatedAt),
    latestDeploymentId: f.latestDeploymentId,
    latestDeploymentCreatedAt: toDate(f.latestDeploymentCreatedAt),
    latestDeploymentStatus: f.latestDeploymentStatus,
    scopes: f.scopes,
    vars: f.vars.map(makeVariable),
    events: f.events,
    schedule: f.schedule,
    timeout: f.timeout,
    entrypoint: f.entrypoint,
    commands: f.commands,
    version: f.version,
    installationId: f.installationId,
    providerRepositoryId: f.providerRepositoryId,
    providerBranch: f.providerBranch,
    providerRootDirectory: f.providerRootDirectory,
    providerSilentMode: f.providerSilentMode,
    buildSpecification: f.buildSpecification,
    runtimeSpecification: f.runtimeSpecification,
    createdAt: toDate(f.$createdAt),
    updatedAt: toDate(f.$updatedAt),
  }
}

/** Convert Appwrite Deployment to API shape: id, createdAt, updatedAt as Date. */
function makeDeployment(d: Models.Deployment) {
  return {
    id: d.$id,
    type: d.type,
    resourceId: d.resourceId,
    resourceType: d.resourceType,
    entrypoint: d.entrypoint,
    sourceSize: d.sourceSize,
    buildSize: d.buildSize,
    totalSize: d.totalSize,
    buildId: d.buildId,
    activate: d.activate,
    screenshotLight: d.screenshotLight,
    screenshotDark: d.screenshotDark,
    status: d.status,
    buildLogs: d.buildLogs,
    buildDuration: d.buildDuration,
    providerRepositoryName: d.providerRepositoryName,
    providerRepositoryOwner: d.providerRepositoryOwner,
    providerRepositoryUrl: d.providerRepositoryUrl,
    providerCommitHash: d.providerCommitHash,
    providerCommitAuthorUrl: d.providerCommitAuthorUrl,
    providerCommitAuthor: d.providerCommitAuthor,
    providerCommitMessage: d.providerCommitMessage,
    providerCommitUrl: d.providerCommitUrl,
    providerBranch: d.providerBranch,
    providerBranchUrl: d.providerBranchUrl,
    createdAt: toDate(d.$createdAt),
    updatedAt: toDate(d.$updatedAt),
  }
}

/** Convert Appwrite Execution to API shape: id, createdAt, updatedAt, permissions, scheduledAt. */
function makeExecution(e: Models.Execution) {
  return {
    id: e.$id,
    functionId: e.functionId,
    deploymentId: e.deploymentId,
    trigger: e.trigger,
    status: e.status,
    requestMethod: e.requestMethod,
    requestPath: e.requestPath,
    requestHeaders: e.requestHeaders,
    responseStatusCode: e.responseStatusCode,
    responseBody: e.responseBody,
    responseHeaders: e.responseHeaders,
    logs: e.logs,
    errors: e.errors,
    duration: e.duration,
    scheduledAt: e.scheduledAt != null ? toDate(e.scheduledAt) : undefined,
    permissions: e.$permissions,
    createdAt: toDate(e.$createdAt),
    updatedAt: toDate(e.$updatedAt),
  }
}

/** Build cursor-based list queries: limit, orderDesc($createdAt), optional cursorBefore. */
function buildListQueries(limit: number, cursor?: string): string[] {
  const q = [Query.limit(limit), Query.orderDesc('$createdAt')]
  if (cursor) q.push(Query.cursorBefore(cursor))
  return q
}

/**
 * Appwrite Functions API service. Extends AppwriteService with Functions SDK methods.
 * All methods require regionId + accountId for region-scoped API access.
 */
export class AppwriteFunctionsService extends AppwriteService {
  #functions(regionId: string, accountId: string) {
    return new Functions(this.projectClient(regionId, accountId))
  }

  async listFunctions(
    accountId: string,
    regionId: string,
    params: { cursor?: string; limit?: number; search?: string },
  ) {
    const limit = params.limit ?? DEFAULT_LIST_LIMIT
    const res = await this.#functions(regionId, accountId).list({
      queries: buildListQueries(limit + 1, params.cursor),
      search: params.search,
      total: false,
    })
    const hasMore = res.functions.length > limit
    const functions = res.functions.slice(0, limit).map(makeFunction)
    const lastFn = functions[functions.length - 1]
    const cursor = hasMore && lastFn ? lastFn.id : undefined
    return { functions, hasMore, cursor }
  }

  async createFunction(
    accountId: string,
    regionId: string,
    params: {
      functionId: string
      name: string
      runtime: Runtime
      execute?: string[]
      events?: string[]
      schedule?: string
      timeout?: number
      enabled?: boolean
      logging?: boolean
      entrypoint?: string
      commands?: string
      scopes?: ProjectKeyScopes[]
      installationId?: string
      providerRepositoryId?: string
      providerBranch?: string
      providerSilentMode?: boolean
      providerRootDirectory?: string
      buildSpecification?: string
      runtimeSpecification?: string
    },
  ) {
    const res = await this.#functions(regionId, accountId).create(params)
    return makeFunction(res)
  }

  async listRuntimes(accountId: string, regionId: string) {
    return this.#functions(regionId, accountId).listRuntimes()
  }

  async listSpecifications(accountId: string, regionId: string) {
    return this.#functions(regionId, accountId).listSpecifications()
  }

  async listTemplates(
    accountId: string,
    regionId: string,
    params: {
      cursor?: string
      limit?: number
      runtimes?: Runtime[]
      useCases?: FunctionTemplateUseCase[]
    },
  ) {
    const limit = params.limit ?? DEFAULT_LIST_LIMIT
    const offset = params.cursor ? parseInt(params.cursor, 10) : 0
    const res = await this.#functions(regionId, accountId).listTemplates({
      runtimes: params.runtimes,
      useCases: params.useCases,
      limit: limit + 1,
      offset,
      total: false,
    })
    const hasMore = res.templates.length > limit
    const templates = res.templates.slice(0, limit)
    const cursor = hasMore ? String(offset + limit) : undefined
    return { templates, hasMore, cursor }
  }

  async getTemplate(accountId: string, regionId: string, params: { templateId: string }) {
    return this.#functions(regionId, accountId).getTemplate(params)
  }

  async getAllFunctionsUsage(accountId: string, regionId: string, params?: { range?: UsageRange }) {
    return this.#functions(regionId, accountId).listUsage(params)
  }

  async getFunction(accountId: string, regionId: string, params: { functionId: string }) {
    const res = await this.#functions(regionId, accountId).get(params)
    return makeFunction(res)
  }

  async updateFunction(
    accountId: string,
    regionId: string,
    params: {
      functionId: string
      name: string
      runtime?: Runtime
      execute?: string[]
      events?: string[]
      schedule?: string
      timeout?: number
      enabled?: boolean
      logging?: boolean
      entrypoint?: string
      commands?: string
      scopes?: ProjectKeyScopes[]
      installationId?: string
      providerRepositoryId?: string
      providerBranch?: string
      providerSilentMode?: boolean
      providerRootDirectory?: string
      buildSpecification?: string
      runtimeSpecification?: string
    },
  ) {
    const res = await this.#functions(regionId, accountId).update(params)
    return makeFunction(res)
  }

  async deleteFunction(accountId: string, regionId: string, params: { functionId: string }) {
    return this.#functions(regionId, accountId).delete(params)
  }

  async updateFunctionDeployment(
    accountId: string,
    regionId: string,
    params: { functionId: string; deploymentId: string },
  ) {
    const res = await this.#functions(regionId, accountId).updateFunctionDeployment(params)
    return makeFunction(res)
  }

  async listDeployments(
    accountId: string,
    regionId: string,
    params: {
      functionId: string
      cursor?: string
      limit?: number
      search?: string
    },
  ) {
    const limit = params.limit ?? DEFAULT_LIST_LIMIT
    const res = await this.#functions(regionId, accountId).listDeployments({
      functionId: params.functionId,
      queries: buildListQueries(limit + 1, params.cursor),
      search: params.search,
      total: false,
    })
    const hasMore = res.deployments.length > limit
    const deployments = res.deployments.slice(0, limit).map(makeDeployment)
    const lastDeployment = deployments[deployments.length - 1]
    const cursor = hasMore && lastDeployment ? lastDeployment.id : undefined
    return { deployments, hasMore, cursor }
  }

  async createDuplicateDeployment(
    accountId: string,
    regionId: string,
    params: { functionId: string; deploymentId: string; buildId?: string },
  ) {
    const res = await this.#functions(regionId, accountId).createDuplicateDeployment(params)
    return makeDeployment(res)
  }

  async createTemplateDeployment(
    accountId: string,
    regionId: string,
    params: {
      functionId: string
      repository: string
      owner: string
      rootDirectory: string
      type: TemplateReferenceType
      reference: string
      activate?: boolean
    },
  ) {
    const res = await this.#functions(regionId, accountId).createTemplateDeployment(params)
    return makeDeployment(res)
  }

  async createVcsDeployment(
    accountId: string,
    regionId: string,
    params: { functionId: string; type: VCSReferenceType; reference: string; activate?: boolean },
  ) {
    const res = await this.#functions(regionId, accountId).createVcsDeployment(params)
    return makeDeployment(res)
  }

  async getDeployment(
    accountId: string,
    regionId: string,
    params: { functionId: string; deploymentId: string },
  ) {
    const res = await this.#functions(regionId, accountId).getDeployment(params)
    return makeDeployment(res)
  }

  async deleteDeployment(
    accountId: string,
    regionId: string,
    params: { functionId: string; deploymentId: string },
  ) {
    return this.#functions(regionId, accountId).deleteDeployment(params)
  }

  async updateDeploymentStatus(
    accountId: string,
    regionId: string,
    params: { functionId: string; deploymentId: string },
  ) {
    const res = await this.#functions(regionId, accountId).updateDeploymentStatus(params)
    return makeDeployment(res)
  }

  async listExecutions(
    accountId: string,
    regionId: string,
    params: { functionId: string; cursor?: string; limit?: number },
  ) {
    const limit = params.limit ?? DEFAULT_LIST_LIMIT
    const res = await this.#functions(regionId, accountId).listExecutions({
      functionId: params.functionId,
      queries: buildListQueries(limit + 1, params.cursor),
      total: false,
    })
    const hasMore = res.executions.length > limit
    const executions = res.executions.slice(0, limit).map(makeExecution)
    const lastExecution = executions[executions.length - 1]
    const cursor = hasMore && lastExecution ? lastExecution.id : undefined
    return { executions, hasMore, cursor }
  }

  async createExecution(
    accountId: string,
    regionId: string,
    params: {
      functionId: string
      body?: string
      async?: boolean
      xpath?: string
      method?: ExecutionMethod
      headers?: Record<string, string>
      scheduledAt?: string
    },
  ) {
    const res = await this.#functions(regionId, accountId).createExecution(params)
    return makeExecution(res)
  }

  async getExecution(
    accountId: string,
    regionId: string,
    params: { functionId: string; executionId: string },
  ) {
    const res = await this.#functions(regionId, accountId).getExecution(params)
    return makeExecution(res)
  }

  async deleteExecution(
    accountId: string,
    regionId: string,
    params: { functionId: string; executionId: string },
  ) {
    return this.#functions(regionId, accountId).deleteExecution(params)
  }

  async getFunctionUsage(
    accountId: string,
    regionId: string,
    params: { functionId: string; range?: UsageRange },
  ) {
    return this.#functions(regionId, accountId).getUsage(params)
  }

  async listVariables(accountId: string, regionId: string, params: { functionId: string }) {
    const res = await this.#functions(regionId, accountId).listVariables(params)
    return { total: res.total, variables: res.variables.map(makeVariable) }
  }

  async createVariable(
    accountId: string,
    regionId: string,
    params: { functionId: string; key: string; value: string; secret?: boolean },
  ) {
    const res = await this.#functions(regionId, accountId).createVariable({
      ...params,
      variableId: ID.unique(),
    })
    return makeVariable(res)
  }

  async getVariable(
    accountId: string,
    regionId: string,
    params: { functionId: string; variableId: string },
  ) {
    const res = await this.#functions(regionId, accountId).getVariable(params)
    return makeVariable(res)
  }

  async updateVariable(
    accountId: string,
    regionId: string,
    params: {
      functionId: string
      variableId: string
      key: string
      value?: string
      secret?: boolean
    },
  ) {
    const res = await this.#functions(regionId, accountId).updateVariable(params)
    return makeVariable(res)
  }

  async deleteVariable(
    accountId: string,
    regionId: string,
    params: { functionId: string; variableId: string },
  ) {
    return this.#functions(regionId, accountId).deleteVariable(params)
  }
}

export const appwriteFunctionsService = new AppwriteFunctionsService()
