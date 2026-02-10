import type { AxiosInstance } from 'axios'
import {
  ApiKeysApi,
  CreateApiKeyPermissionsEnum,
  DockerRegistryApi,
  OrganizationsApi,
  RegionsApi,
  SandboxApi,
  SnapshotsApi,
  UsersApi,
  VolumesApi,
} from '@daytonaio/api-client'
import { Daytona, DaytonaNotFoundError } from '@daytonaio/sdk'

import { getUuid, LRUCache, lruCacheSizeCalculation, stripIdPrefix } from '@cared/shared'

import type {
  Configuration,
  CreateApiKey,
  CreateDockerRegistry,
  CreateOrganization,
  CreateSandbox,
  CreateSnapshot,
  CreateVolume,
  GetAllSnapshotsOrderEnum,
  GetAllSnapshotsSortEnum,
  ListSandboxesPaginatedOrderEnum,
  ListSandboxesPaginatedSortEnum,
  ListSandboxesPaginatedStatesEnum,
  ObjectStorageApi,
  Sandbox,
  SandboxLabels,
  UpdateDockerRegistry,
  UpdateSandboxStateDto,
} from '@daytonaio/api-client'
import type { SnapshotService, VolumeService } from '@daytonaio/sdk'
import { env } from '../../env'

function toDate(v: string | Date): Date
function toDate(v: null | undefined): undefined
function toDate(v: string | Date | null | undefined): Date | undefined
function toDate(v: string | Date | null | undefined): Date | undefined {
  if (v == null) return undefined
  if (v instanceof Date) return v
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

interface DaytonaInterface {
  readonly clientConfig: Configuration
  readonly axios: AxiosInstance

  // raw api
  readonly sandboxApi: SandboxApi & {
    axios: AxiosInstance
  }
  readonly objectStorageApi: ObjectStorageApi

  // wrapped api
  readonly volume: VolumeService
  readonly snapshot: SnapshotService
}

function daytonaInterface(client: Daytona): DaytonaInterface {
  const intf = client as unknown as DaytonaInterface
  return {
    clientConfig: intf.clientConfig,
    axios: intf.sandboxApi.axios,
    sandboxApi: intf.sandboxApi,
    objectStorageApi: intf.objectStorageApi,
    volume: intf.volume,
    snapshot: intf.snapshot,
  }
}

class ToolboxProxyUrlCache {
  #cache = new LRUCache<string, Promise<string>>({
    maxSize: 50 * 1024 * 1024,
    sizeCalculation: lruCacheSizeCalculation,
    ttl: 5 * 60 * 1000,
  })

  get(regionId: string): Promise<string> | undefined {
    return this.#cache.get(regionId)
  }

  set(regionId: string, urlPromise: Promise<string>) {
    this.#cache.set(regionId, urlPromise)
  }
}

export class DaytonaService {
  static #daytona: Daytona | undefined

  static #toolboxProxyUrlCache = new ToolboxProxyUrlCache()

  get adminClient(): Daytona {
    if (!DaytonaService.#daytona) {
      DaytonaService.#daytona = new Daytona({
        apiUrl: env.DAYTONA_API_URL!,
        apiKey: env.DAYTONA_ADMIN_API_KEY!,
      })
      ;(DaytonaService.#daytona as any).toolboxProxyCache = DaytonaService.#toolboxProxyUrlCache
    }

    return DaytonaService.#daytona
  }

  client(accountId: string): Daytona {
    const client = new Daytona({
      apiUrl: env.DAYTONA_API_URL!,
      apiKey: this.#organizationApiKey(accountId),
    })
    ;(client as any).toolboxProxyCache = DaytonaService.#toolboxProxyUrlCache

    return client
  }

  #adminIntf() {
    return daytonaInterface(this.adminClient)
  }

  #userIntf(accountId: string) {
    return daytonaInterface(this.client(accountId))
  }

  #userId(userId: string) {
    return userId
  }

  #organizationId(accountId: string) {
    return getUuid(accountId)
  }

  #organizationApiKey(accountId: string) {
    return `sk-${stripIdPrefix(accountId)}-${env.DAYTONA_ORGANIZATION_API_KEY!}`
  }

  async #ensureUser(userId: string) {
    const intf = this.#adminIntf()
    const usersApi = new UsersApi(intf.clientConfig, '', intf.axios)
    try {
      await usersApi.getUser(this.#userId(userId))
      return
    } catch (err) {
      if (!(err instanceof DaytonaNotFoundError)) {
        throw err
      }
    }
    await usersApi.createUser({
      id: this.#userId(userId),
      name: '',
    })
  }

  async #ensureOrganization(userId: string, accountId: string) {
    const intf = this.#adminIntf()
    const orgsApi = new OrganizationsApi(intf.clientConfig, '', intf.axios)
    try {
      await orgsApi.getOrganization(this.#organizationId(accountId))
    } catch (err) {
      if (!(err instanceof DaytonaNotFoundError)) {
        throw err
      }
    }
    await orgsApi.createOrganization({
      name: accountId,
      defaultRegionId: '',
      id: this.#organizationId(accountId),
      userId: this.#userId(userId),
    } as CreateOrganization)
  }

  async #ensureApiKey(userId: string, accountId: string) {
    const intf = this.#adminIntf()
    const apiKeysApi = new ApiKeysApi(intf.clientConfig, '', intf.axios)
    try {
      await apiKeysApi.getApiKey('Cared', this.#organizationId(accountId), this.#userId(userId))
      return
    } catch (err) {
      if (!(err instanceof DaytonaNotFoundError)) {
        throw err
      }
    }
    await apiKeysApi.createApiKey({
      name: 'Cared',
      permissions: [
        CreateApiKeyPermissionsEnum.WRITE_REGISTRIES,
        CreateApiKeyPermissionsEnum.DELETE_REGISTRIES,
        CreateApiKeyPermissionsEnum.WRITE_SNAPSHOTS,
        CreateApiKeyPermissionsEnum.DELETE_SNAPSHOTS,
        CreateApiKeyPermissionsEnum.WRITE_SANDBOXES,
        CreateApiKeyPermissionsEnum.DELETE_SANDBOXES,
        CreateApiKeyPermissionsEnum.READ_VOLUMES,
        CreateApiKeyPermissionsEnum.WRITE_VOLUMES,
        CreateApiKeyPermissionsEnum.DELETE_VOLUMES,
        CreateApiKeyPermissionsEnum.WRITE_REGIONS,
        CreateApiKeyPermissionsEnum.DELETE_REGIONS,
        CreateApiKeyPermissionsEnum.READ_RUNNERS,
        CreateApiKeyPermissionsEnum.WRITE_RUNNERS,
        CreateApiKeyPermissionsEnum.DELETE_RUNNERS,
        CreateApiKeyPermissionsEnum.READ_AUDIT_LOGS,
      ],
      apiKey: this.#organizationApiKey(accountId),
      organizationId: this.#organizationId(accountId),
      userId: this.#userId(userId),
    } as CreateApiKey)
  }

  async ensure(userId: string, accountId: string) {
    await this.#ensureUser(userId)
    await this.#ensureOrganization(userId, accountId)
    await this.#ensureApiKey(userId, accountId)
  }

  /** User-facing APIs */

  async listRegions(accountId: string) {
    const intf = this.#userIntf(accountId)
    const api = new RegionsApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.listSharedRegions()
    return (
      data
        // TODO: support dedicated?
        .filter((r) => ['shared', 'custom'].includes(r.regionType))
        .map((r) => {
          const { organizationId: _omit, regionType, ...rest } = r
          return {
            ...rest,
            regionType: regionType as 'shared' | 'custom',
            createdAt: toDate(r.createdAt),
            updatedAt: toDate(r.updatedAt),
          }
        })
    )
  }

  #makeSandbox(s: Sandbox) {
    return {
      id: s.id,
      name: s.name,
      snapshot: s.snapshot,
      user: s.user,
      env: s.env,
      labels: s.labels,
      public: s.public,
      networkBlockAll: s.networkBlockAll,
      networkAllowList: s.networkAllowList,
      regionId: s.target,
      cpu: s.cpu,
      memory: s.memory,
      disk: s.disk,
      gpu: s.gpu,
      state: s.state,
      desiredState: s.desiredState,
      errorReason: s.errorReason,
      recoverable: s.recoverable,
      backupState: s.backupState,
      backupCreatedAt: toDate(s.backupCreatedAt),
      autoStopInterval: s.autoStopInterval,
      autoArchiveInterval: s.autoArchiveInterval,
      autoDeleteInterval: s.autoDeleteInterval,
      volumes: s.volumes,
      buildInfo: s.buildInfo,
      createdAt: toDate(s.createdAt),
      updatedAt: toDate(s.updatedAt),
      daemonVersion: s.daemonVersion,
    }
  }

  async listSandboxes(
    accountId: string,
    opts?: {
      cursor?: string
      limit?: number
      id?: string
      name?: string
      labels?: string
      includeErroredDeleted?: boolean
      states?: ListSandboxesPaginatedStatesEnum[]
      snapshots?: string[]
      regionIds?: string[]
      minCpu?: number
      maxCpu?: number
      minMemory?: number
      maxMemory?: number
      minDisk?: number
      maxDisk?: number
      lastEventAfter?: Date
      lastEventBefore?: Date
      sort?: ListSandboxesPaginatedSortEnum
      order?: ListSandboxesPaginatedOrderEnum
    },
  ) {
    const page = parseInt(opts?.cursor ?? '0', 10)
    const pageNum = Number.isNaN(page) || page < 0 ? 0 : page
    const intf = this.#userIntf(accountId)
    const api = new SandboxApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.listSandboxesPaginated(
      undefined,
      pageNum,
      opts?.limit,
      opts?.id,
      opts?.name,
      opts?.labels,
      opts?.includeErroredDeleted,
      opts?.states,
      opts?.snapshots,
      opts?.regionIds,
      opts?.minCpu,
      opts?.maxCpu,
      opts?.minMemory,
      opts?.maxMemory,
      opts?.minDisk,
      opts?.maxDisk,
      opts?.lastEventAfter,
      opts?.lastEventBefore,
      opts?.sort,
      opts?.order,
    )
    const hasMore = data.page + 1 < data.totalPages
    return {
      sandboxes: data.items.map((s) => this.#makeSandbox(s)),
      hasMore,
      cursor: hasMore ? String(data.page + 1) : undefined,
    }
  }

  async getSandbox(accountId: string, sandboxIdOrName: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.getSandbox(sandboxIdOrName, undefined, true)
    return this.#makeSandbox(data)
  }

  async createSandbox(
    accountId: string,
    createSandbox: Omit<CreateSandbox, 'class' | 'target'> & {
      regionId?: string
    },
  ) {
    const intf = this.#userIntf(accountId)
    const { regionId: target, ...args } = createSandbox
    const { data } = await intf.sandboxApi.createSandbox({
      ...args,
      target,
    })
    return this.#makeSandbox(data)
  }

  async deleteSandbox(accountId: string, sandboxIdOrName: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.deleteSandbox(sandboxIdOrName)
    return this.#makeSandbox(data)
  }

  async startSandbox(accountId: string, sandboxIdOrName: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.startSandbox(sandboxIdOrName)
    return this.#makeSandbox(data)
  }

  async stopSandbox(accountId: string, sandboxIdOrName: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.stopSandbox(sandboxIdOrName)
    return this.#makeSandbox(data)
  }

  async archiveSandbox(accountId: string, sandboxIdOrName: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.archiveSandbox(sandboxIdOrName)
    return this.#makeSandbox(data)
  }

  async createBackup(accountId: string, sandboxIdOrName: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.createBackup(sandboxIdOrName)
    return this.#makeSandbox(data)
  }

  async recoverSandbox(accountId: string, sandboxIdOrName: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.recoverSandbox(sandboxIdOrName)
    return this.#makeSandbox(data)
  }

  async setAutoArchiveInterval(accountId: string, sandboxIdOrName: string, interval: number) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.setAutoArchiveInterval(sandboxIdOrName, interval)
    return this.#makeSandbox(data)
  }

  async setAutoDeleteInterval(accountId: string, sandboxIdOrName: string, interval: number) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.setAutoDeleteInterval(sandboxIdOrName, interval)
    return this.#makeSandbox(data)
  }

  async setAutostopInterval(accountId: string, sandboxIdOrName: string, interval: number) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.setAutostopInterval(sandboxIdOrName, interval)
    return this.#makeSandbox(data)
  }

  async getPortPreviewUrl(accountId: string, sandboxIdOrName: string, port: number) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.getPortPreviewUrl(sandboxIdOrName, port)
    return { ...data, port }
  }

  async getSignedPortPreviewUrl(
    accountId: string,
    sandboxIdOrName: string,
    port: number,
    expiresInSeconds?: number,
  ) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.getSignedPortPreviewUrl(
      sandboxIdOrName,
      port,
      undefined,
      expiresInSeconds,
    )
    return data
  }

  async expireSignedPortPreviewUrl(
    accountId: string,
    sandboxIdOrName: string,
    port: number,
    token: string,
  ) {
    const intf = this.#userIntf(accountId)
    await intf.sandboxApi.expireSignedPortPreviewUrl(sandboxIdOrName, port, token)
  }

  async createSshAccess(accountId: string, sandboxIdOrName: string, expiresInMinutes?: number) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.createSshAccess(
      sandboxIdOrName,
      undefined,
      expiresInMinutes,
    )
    return {
      id: data.id,
      sandboxId: data.sandboxId,
      sshCommand: data.sshCommand,
      token: data.token,
      expiresAt: toDate(data.expiresAt),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  async revokeSshAccess(accountId: string, sandboxIdOrName: string, token?: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.revokeSshAccess(sandboxIdOrName, undefined, token)
    return this.#makeSandbox(data)
  }

  async validateSshAccess(accountId: string, token: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.validateSshAccess(token)
    return {
      valid: data.valid,
      sandboxId: data.sandboxId,
    }
  }

  async getBuildLogsUrl(accountId: string, sandboxIdOrName: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.getBuildLogsUrl(sandboxIdOrName)
    return {
      url: data.url,
    }
  }

  async getToolboxProxyUrl(accountId: string, sandboxId: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.getToolboxProxyUrl(sandboxId)
    return {
      url: data.url,
    }
  }

  async replaceLabels(accountId: string, sandboxIdOrName: string, sandboxLabels: SandboxLabels) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.replaceLabels(sandboxIdOrName, sandboxLabels)
    return {
      labels: data.labels,
    }
  }

  async updateLastActivity(accountId: string, sandboxId: string) {
    const intf = this.#userIntf(accountId)
    await intf.sandboxApi.updateLastActivity(sandboxId)
  }

  async updatePublicStatus(accountId: string, sandboxIdOrName: string, isPublic: boolean) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.sandboxApi.updatePublicStatus(sandboxIdOrName, isPublic)
    return this.#makeSandbox(data)
  }

  async updateSandboxState(
    accountId: string,
    sandboxId: string,
    updateSandboxStateDto: UpdateSandboxStateDto,
  ) {
    const intf = this.#userIntf(accountId)
    await intf.sandboxApi.updateSandboxState(sandboxId, updateSandboxStateDto)
  }

  async getSnapshots(
    accountId: string,
    opts?: {
      page?: number
      limit?: number
      name?: string
      sort?: GetAllSnapshotsSortEnum
      order?: GetAllSnapshotsOrderEnum
    },
  ) {
    const intf = this.#userIntf(accountId)
    const api = new SnapshotsApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.getAllSnapshots(
      undefined,
      opts?.page,
      opts?.limit,
      opts?.name,
      opts?.sort,
      opts?.order,
    )
    return {
      snapshots: data.items.map((item) => ({
        ...item,
        size: item.size ?? undefined,
        entrypoint: item.entrypoint ?? undefined,
        errorReason: item.errorReason ?? undefined,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        lastUsedAt: item.lastUsedAt ?? undefined,
      })),
      page: data.page,
    }
  }

  async getSnapshot(accountId: string, id: string) {
    const intf = this.#userIntf(accountId)
    const api = new SnapshotsApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.getSnapshot(id)
    return {
      ...data,
      size: data.size ?? undefined,
      entrypoint: data.entrypoint ?? undefined,
      errorReason: data.errorReason ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastUsedAt: data.lastUsedAt ?? undefined,
    }
  }

  async createSnapshot(accountId: string, createSnapshot: Omit<CreateSnapshot, 'general'>) {
    const intf = this.#userIntf(accountId)
    const api = new SnapshotsApi(intf.clientConfig, '', intf.axios)
    const {
      data: { organizationId: _omit, general: _omit2, initialRunnerId: _omit3, ...data },
    } = await api.createSnapshot({ ...createSnapshot, general: false })
    return {
      ...data,
      size: data.size ?? undefined,
      entrypoint: data.entrypoint ?? undefined,
      errorReason: data.errorReason ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastUsedAt: data.lastUsedAt ?? undefined,
    }
  }

  async removeSnapshot(accountId: string, id: string) {
    const intf = this.#userIntf(accountId)
    const api = new SnapshotsApi(intf.clientConfig, '', intf.axios)
    await api.removeSnapshot(id)
  }

  async activateSnapshot(accountId: string, id: string) {
    const intf = this.#userIntf(accountId)
    const api = new SnapshotsApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.activateSnapshot(id)
    return {
      ...data,
      size: data.size ?? undefined,
      entrypoint: data.entrypoint ?? undefined,
      errorReason: data.errorReason ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastUsedAt: data.lastUsedAt ?? undefined,
    }
  }

  async deactivateSnapshot(accountId: string, id: string) {
    const intf = this.#userIntf(accountId)
    const api = new SnapshotsApi(intf.clientConfig, '', intf.axios)
    await api.deactivateSnapshot(id)
  }

  async getSnapshotBuildLogsUrl(accountId: string, id: string) {
    const intf = this.#userIntf(accountId)
    const api = new SnapshotsApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.getSnapshotBuildLogsUrl(id)
    return data
  }

  async listVolumes(accountId: string, includeDeleted?: boolean) {
    const intf = this.#userIntf(accountId)
    const api = new VolumesApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.listVolumes(undefined, includeDeleted)
    return data.map((v) => {
      const { organizationId: _omit, ...rest } = v
      return {
        ...rest,
        errorReason: rest.errorReason ?? undefined,
        createdAt: toDate(v.createdAt),
        updatedAt: toDate(v.updatedAt),
        lastUsedAt: toDate(v.lastUsedAt),
      }
    })
  }

  async getVolume(accountId: string, volumeId: string) {
    const intf = this.#userIntf(accountId)
    const api = new VolumesApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.getVolume(volumeId)
    const { organizationId: _omit, ...rest } = data
    return {
      ...rest,
      errorReason: rest.errorReason ?? undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      lastUsedAt: toDate(data.lastUsedAt),
    }
  }

  async getVolumeByName(accountId: string, name: string) {
    const intf = this.#userIntf(accountId)
    const api = new VolumesApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.getVolumeByName(name)
    const { organizationId: _omit, ...rest } = data
    return {
      ...rest,
      errorReason: rest.errorReason ?? undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      lastUsedAt: toDate(data.lastUsedAt),
    }
  }

  async createVolume(accountId: string, createVolume: CreateVolume) {
    const intf = this.#userIntf(accountId)
    const api = new VolumesApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.createVolume(createVolume)
    const { organizationId: _omit, ...rest } = data
    return {
      ...rest,
      errorReason: rest.errorReason ?? undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      lastUsedAt: toDate(data.lastUsedAt),
    }
  }

  async deleteVolume(accountId: string, volumeId: string) {
    const intf = this.#userIntf(accountId)
    const api = new VolumesApi(intf.clientConfig, '', intf.axios)
    await api.deleteVolume(volumeId)
  }

  async getS3PushAccess(accountId: string) {
    const intf = this.#userIntf(accountId)
    const { data } = await intf.objectStorageApi.getPushAccess()
    const { organizationId: _omit, ...rest } = data
    return {
      url: rest.storageUrl,
      accessKeyId: rest.accessKey,
      secretAccessKey: rest.secret,
      sessionToken: rest.sessionToken,
      bucket: rest.bucket,
    }
  }

  async listRegistries(accountId: string) {
    const intf = this.#userIntf(accountId)
    const api = new DockerRegistryApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.listRegistries()
    return data.map(
      ({
        registryType: _omit, // always `organization`
        ...r
      }) => ({
        ...r,
        project: r.project || undefined,
        createdAt: toDate(r.createdAt),
        updatedAt: toDate(r.updatedAt),
      }),
    )
  }

  async getRegistry(accountId: string, id: string) {
    const intf = this.#userIntf(accountId)
    const api = new DockerRegistryApi(intf.clientConfig, '', intf.axios)
    const {
      data: { registryType: _omit, ...data },
    } = await api.getRegistry(id)
    return {
      ...data,
      project: data.project || undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  async createRegistry(
    accountId: string,
    createDockerRegistry: Omit<CreateDockerRegistry, 'registryType' | 'isDefault'>,
  ) {
    const intf = this.#userIntf(accountId)
    const api = new DockerRegistryApi(intf.clientConfig, '', intf.axios)
    const {
      data: { registryType: _omit, ...data },
    } = await api.createRegistry({
      ...createDockerRegistry,
      registryType: 'organization',
      isDefault: false,
    })
    return {
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  async updateRegistry(accountId: string, id: string, updateDockerRegistry: UpdateDockerRegistry) {
    const intf = this.#userIntf(accountId)
    const api = new DockerRegistryApi(intf.clientConfig, '', intf.axios)
    const {
      data: { registryType: _omit, ...data },
    } = await api.updateRegistry(id, updateDockerRegistry)
    return {
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  async deleteRegistry(accountId: string, id: string) {
    const intf = this.#userIntf(accountId)
    const api = new DockerRegistryApi(intf.clientConfig, '', intf.axios)
    await api.deleteRegistry(id)
  }

  async getRegistryTransientPushAccess(accountId: string, regionId?: string) {
    const intf = this.#userIntf(accountId)
    const api = new DockerRegistryApi(intf.clientConfig, '', intf.axios)
    const { data } = await api.getTransientPushAccess(undefined, regionId)
    return { ...data, expiresAt: toDate(data.expiresAt) }
  }
}

export const daytonaService = new DaytonaService()
