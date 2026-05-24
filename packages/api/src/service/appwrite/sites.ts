import { Query, Sites } from '@appwrite.io/console'

import type {
  Adapter,
  BuildRuntime,
  Framework,
  Frameworks,
  Models,
  TemplateReferenceType,
  UsageRange,
  UseCases,
  VCSReferenceType,
} from '@appwrite.io/console'
import { AppwriteService, toDate } from './base'

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

/** Convert Appwrite Site to API shape: id, createdAt, updatedAt, date fields as Date, vars normalized. */
function makeSite(s: Models.Site) {
  return {
    id: s.$id,
    name: s.name,
    enabled: s.enabled,
    live: s.live,
    logging: s.logging,
    framework: s.framework,
    deploymentId: s.deploymentId,
    deploymentCreatedAt: toDate(s.deploymentCreatedAt),
    deploymentScreenshotLight: s.deploymentScreenshotLight,
    deploymentScreenshotDark: s.deploymentScreenshotDark,
    latestDeploymentId: s.latestDeploymentId,
    latestDeploymentCreatedAt: toDate(s.latestDeploymentCreatedAt),
    latestDeploymentStatus: s.latestDeploymentStatus,
    vars: s.vars.map(makeVariable),
    timeout: s.timeout,
    installCommand: s.installCommand,
    buildCommand: s.buildCommand,
    outputDirectory: s.outputDirectory,
    installationId: s.installationId,
    providerRepositoryId: s.providerRepositoryId,
    providerBranch: s.providerBranch,
    providerRootDirectory: s.providerRootDirectory,
    providerSilentMode: s.providerSilentMode,
    specification: s.specification,
    buildRuntime: s.buildRuntime,
    adapter: s.adapter,
    fallbackFile: s.fallbackFile,
    createdAt: toDate(s.$createdAt),
    updatedAt: toDate(s.$updatedAt),
  }
}

/** Convert Appwrite Deployment (site or function) to API shape: id, createdAt, updatedAt as Date. */
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

/** Convert Appwrite Execution (site log or function execution) to API shape: id, createdAt, updatedAt, permissions, scheduledAt. */
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
 * Appwrite Sites API service. Extends AppwriteService with Sites SDK methods.
 * All methods require regionId + accountId for region-scoped API access.
 * Method names omit redundant "Site" prefix (e.g. list, get, listTemplates, listDeployments).
 */
export class AppwriteSitesService extends AppwriteService {
  #sites(regionId: string, accountId: string) {
    return new Sites(this.projectClient(regionId, accountId))
  }

  async list(
    accountId: string,
    regionId: string,
    params: { cursor?: string; limit?: number; search?: string },
  ) {
    const limit = params.limit ?? DEFAULT_LIST_LIMIT
    const res = await this.#sites(regionId, accountId).list({
      queries: buildListQueries(limit + 1, params.cursor),
      search: params.search,
      total: false,
    })
    const hasMore = res.sites.length > limit
    const rawSites = res.sites.slice(0, limit)
    const sites = rawSites.map(makeSite)
    const lastSite = sites[sites.length - 1]
    const cursor = hasMore && lastSite ? lastSite.id : undefined
    return { sites, hasMore, cursor }
  }

  async create(
    accountId: string,
    regionId: string,
    params: {
      siteId: string
      name: string
      framework: Framework
      buildRuntime: BuildRuntime
      enabled?: boolean
      logging?: boolean
      timeout?: number
      installCommand?: string
      buildCommand?: string
      outputDirectory?: string
      adapter?: Adapter
      installationId?: string
      fallbackFile?: string
      providerRepositoryId?: string
      providerBranch?: string
      providerSilentMode?: boolean
      providerRootDirectory?: string
      specification?: string
    },
  ) {
    const res = await this.#sites(regionId, accountId).create(params)
    return makeSite(res)
  }

  async listFrameworks(accountId: string, regionId: string) {
    return this.#sites(regionId, accountId).listFrameworks()
  }

  async listSpecifications(accountId: string, regionId: string) {
    return this.#sites(regionId, accountId).listSpecifications()
  }

  async listTemplates(
    accountId: string,
    regionId: string,
    params: {
      cursor?: string
      limit?: number
      frameworks?: Frameworks[]
      useCases?: UseCases[]
    },
  ) {
    const limit = params.limit ?? DEFAULT_LIST_LIMIT
    const offset = params.cursor ? parseInt(params.cursor, 10) : 0
    const res = await this.#sites(regionId, accountId).listTemplates({
      frameworks: params.frameworks,
      useCases: params.useCases,
      limit: limit + 1,
      offset,
    })
    const hasMore = res.templates.length > limit
    const templates = res.templates.slice(0, limit)
    const cursor = hasMore ? String(offset + limit) : undefined
    return { templates, hasMore, cursor }
  }

  async getTemplate(accountId: string, regionId: string, params: { templateId: string }) {
    return this.#sites(regionId, accountId).getTemplate(params)
  }

  async getAllSitesUsage(accountId: string, regionId: string, params?: { range?: UsageRange }) {
    return this.#sites(regionId, accountId).listUsage(params)
  }

  async get(accountId: string, regionId: string, params: { siteId: string }) {
    const res = await this.#sites(regionId, accountId).get(params)
    return makeSite(res)
  }

  async update(
    accountId: string,
    regionId: string,
    params: {
      siteId: string
      name: string
      framework: Framework
      enabled?: boolean
      logging?: boolean
      timeout?: number
      installCommand?: string
      buildCommand?: string
      outputDirectory?: string
      buildRuntime?: BuildRuntime
      adapter?: Adapter
      fallbackFile?: string
      installationId?: string
      providerRepositoryId?: string
      providerBranch?: string
      providerSilentMode?: boolean
      providerRootDirectory?: string
      specification?: string
    },
  ) {
    const res = await this.#sites(regionId, accountId).update(params)
    return makeSite(res)
  }

  async delete(accountId: string, regionId: string, params: { siteId: string }) {
    return this.#sites(regionId, accountId).delete(params)
  }

  async updateDeployment(
    accountId: string,
    regionId: string,
    params: { siteId: string; deploymentId: string },
  ) {
    const res = await this.#sites(regionId, accountId).updateSiteDeployment(params)
    return makeSite(res)
  }

  async listDeployments(
    accountId: string,
    regionId: string,
    params: { siteId: string; cursor?: string; limit?: number; search?: string },
  ) {
    const limit = params.limit ?? DEFAULT_LIST_LIMIT
    const res = await this.#sites(regionId, accountId).listDeployments({
      siteId: params.siteId,
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
    params: { siteId: string; deploymentId: string },
  ) {
    const res = await this.#sites(regionId, accountId).createDuplicateDeployment(params)
    return makeDeployment(res)
  }

  async createTemplateDeployment(
    accountId: string,
    regionId: string,
    params: {
      siteId: string
      repository: string
      owner: string
      rootDirectory: string
      type: TemplateReferenceType
      reference: string
      activate?: boolean
    },
  ) {
    const res = await this.#sites(regionId, accountId).createTemplateDeployment(params)
    return makeDeployment(res)
  }

  async createVcsDeployment(
    accountId: string,
    regionId: string,
    params: { siteId: string; type: VCSReferenceType; reference: string; activate?: boolean },
  ) {
    const res = await this.#sites(regionId, accountId).createVcsDeployment(params)
    return makeDeployment(res)
  }

  async getDeployment(
    accountId: string,
    regionId: string,
    params: { siteId: string; deploymentId: string },
  ) {
    const res = await this.#sites(regionId, accountId).getDeployment(params)
    return makeDeployment(res)
  }

  async deleteDeployment(
    accountId: string,
    regionId: string,
    params: { siteId: string; deploymentId: string },
  ) {
    return this.#sites(regionId, accountId).deleteDeployment(params)
  }

  async updateDeploymentStatus(
    accountId: string,
    regionId: string,
    params: { siteId: string; deploymentId: string },
  ) {
    const res = await this.#sites(regionId, accountId).updateDeploymentStatus(params)
    return makeDeployment(res)
  }

  async listLogs(
    accountId: string,
    regionId: string,
    params: { siteId: string; cursor?: string; limit?: number },
  ) {
    const limit = params.limit ?? DEFAULT_LIST_LIMIT
    const res = await this.#sites(regionId, accountId).listLogs({
      siteId: params.siteId,
      queries: buildListQueries(limit + 1, params.cursor),
      total: false,
    })
    const hasMore = res.executions.length > limit
    const executions = res.executions.slice(0, limit).map(makeExecution)
    const lastExecution = executions[executions.length - 1]
    const cursor = hasMore && lastExecution ? lastExecution.id : undefined
    return { executions, hasMore, cursor }
  }

  async getLog(accountId: string, regionId: string, params: { siteId: string; logId: string }) {
    const res = await this.#sites(regionId, accountId).getLog(params)
    return makeExecution(res)
  }

  async deleteLog(accountId: string, regionId: string, params: { siteId: string; logId: string }) {
    return this.#sites(regionId, accountId).deleteLog(params)
  }

  async getUsage(
    accountId: string,
    regionId: string,
    params: { siteId: string; range?: UsageRange },
  ) {
    return this.#sites(regionId, accountId).getUsage(params)
  }

  async listVariables(accountId: string, regionId: string, params: { siteId: string }) {
    const res = await this.#sites(regionId, accountId).listVariables(params)
    return { total: res.total, variables: res.variables.map(makeVariable) }
  }

  async createVariable(
    accountId: string,
    regionId: string,
    params: { siteId: string; key: string; value: string; secret?: boolean },
  ) {
    const res = await this.#sites(regionId, accountId).createVariable(params)
    return makeVariable(res)
  }

  async getVariable(
    accountId: string,
    regionId: string,
    params: { siteId: string; variableId: string },
  ) {
    const res = await this.#sites(regionId, accountId).getVariable(params)
    return makeVariable(res)
  }

  async updateVariable(
    accountId: string,
    regionId: string,
    params: { siteId: string; variableId: string; key: string; value?: string; secret?: boolean },
  ) {
    const res = await this.#sites(regionId, accountId).updateVariable(params)
    return makeVariable(res)
  }

  async deleteVariable(
    accountId: string,
    regionId: string,
    params: { siteId: string; variableId: string },
  ) {
    return this.#sites(regionId, accountId).deleteVariable(params)
  }
}

export const appwriteSitesService = new AppwriteSitesService()
