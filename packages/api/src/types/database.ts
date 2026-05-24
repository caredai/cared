import type { Neon } from '@cared/db/schema'

import type {
  AllowedIps,
  Branch,
  BranchRestrictedAction,
  ConnectionDetails,
  ConnectionParameters,
  DefaultEndpointSettings,
  Endpoint,
  EndpointSettingsData,
  MaintenanceWindow,
  Database as NeonDatabase,
  Operation,
  PreloadLibraries,
  Project,
  ProjectListItem,
  ProjectQuota,
  ProjectSettingsData,
  Role,
} from '@neondatabase/api-client'

export enum DatabaseTier {
  LOW_COST = 'low-cost',
  NORMAL = 'normal',
}

/** Allowed Neon regions for database namespaces */
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

export const POSTGRES_VERSIONS = [17, 18] as const

/** Minimum/maximum compute units for autoscaling endpoints. */
export type DatabaseComputeUnit = number

/** Neon compute provisioner (e.g. `k8s-pod`, `k8s-neonvm`). */
export type DatabaseProvisioner = string

/** Postgres major version for a database namespace. */
export type DatabasePgVersion = number

/**
 * Scale-to-zero suspend timeout in seconds.
 * `0` uses the Neon default; `-1` means never suspend.
 */
export type DatabaseSuspendTimeoutSeconds = number

/** Raw Postgres settings key-value map. */
export type DatabasePgSettings = Record<string, string>

/** Raw PgBouncer settings key-value map. */
export type DatabasePgbouncerSettings = Record<string, string>

/** Branch lifecycle state (`init`, `resetting`, `ready`, `archived`, ...). */
export type DatabaseBranchState = 'init' | 'resetting' | 'ready' | 'archived' | (string & {})

/** Branch restore workflow state. */
export type DatabaseBranchRestoreStatus = 'restored' | 'finalized' | 'detaching' | (string & {})

/** Branch initialization source. */
export type DatabaseBranchInitSource = 'schema-only' | 'parent-data' | (string & {})

/** Project audit log level. */
export type DatabaseAuditLogLevel = 'base' | 'extended' | 'full'

/** Compute endpoint type. */
export type DatabaseEndpointType = 'read_write' | 'read_only'

/** Compute endpoint runtime state. */
export type DatabaseEndpointState = 'init' | 'active' | 'idle' | (string & {})

/** PgBouncer pooler mode (Neon supports `transaction` only). */
export type DatabaseEndpointPoolerMode = 'transaction'

/** Postgres role authentication method. */
export type DatabaseRoleAuthenticationMethod = 'password' | 'oauth' | 'no_login' | (string & {})

/** Time bucket size for endpoint monitoring stats. */
export type DatabaseEndpointStatsGrouping = '1min' | '5min' | '10min' | '1hour' | '1day'

export interface DatabaseEndpointStatsChartPoint {
  timestamp: Date
  allocatedCu?: number
  ramBytes?: number
  /** True when the compute was inactive (no provisioned CPU). */
  inactive: boolean
}

/** Neon async operation action. */
export type DatabaseOperationAction = string

/** Neon async operation status. */
export type DatabaseOperationStatus =
  | 'scheduling'
  | 'running'
  | 'finished'
  | 'failed'
  | 'error'
  | 'cancelling'
  | 'cancelled'
  | 'skipped'
  | (string & {})

/** A Neon async operation (e.g. branch create, endpoint start). */
export interface DatabaseOperation {
  id: string
  branchId?: string
  endpointId?: string
  action: DatabaseOperationAction
  status: DatabaseOperationStatus
  error?: string
  failuresCount: number
  retryAt?: Date
  createdAt: Date
  updatedAt: Date
  totalDurationMs: number
}

/** Connection parameters returned when a branch is created. */
export interface DatabaseConnectionParameters {
  database: string
  password: string
  role: string
  host: string
  poolerHost: string
}

/** Connection URI + parameters returned when a branch is created. */
export interface DatabaseConnectionDetails {
  connectionUri: string
  connectionParameters: DatabaseConnectionParameters
}

/** Parse an ISO-8601 timestamp from Neon into a Date. */
function parseTimestamp(value: string): Date {
  return new Date(value)
}

/** Parse an optional ISO-8601 timestamp from Neon into a Date. */
function parseOptionalTimestamp(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined
}

export interface DatabaseNamespaceQuota {
  activeTimeSeconds?: number
  computeTimeSeconds?: number
  writtenDataBytes?: number
  dataTransferBytes?: number
  logicalSizeBytes?: number
}

export interface DatabaseNamespaceAllowedIps {
  ips?: string[]
  protectedBranchesOnly?: boolean
}

export interface DatabaseNamespaceMaintenanceWindow {
  weekdays: number[]
  startTime: string
  endTime: string
}

export interface DatabaseNamespacePreloadLibraries {
  useDefaults?: boolean
  enabledLibraries?: string[]
}

export interface DatabaseNamespaceDefaultEndpointSettings {
  pgSettings?: DatabasePgSettings
  pgbouncerSettings?: DatabasePgbouncerSettings
  autoscalingLimitMinCu?: DatabaseComputeUnit
  autoscalingLimitMaxCu?: DatabaseComputeUnit
  suspendTimeoutSeconds?: DatabaseSuspendTimeoutSeconds
}

export interface DatabaseNamespaceProjectSettings {
  quota?: DatabaseNamespaceQuota
  allowedIps?: DatabaseNamespaceAllowedIps
  enableLogicalReplication?: boolean
  maintenanceWindow?: DatabaseNamespaceMaintenanceWindow
  blockPublicConnections?: boolean
  blockVpcConnections?: boolean
  auditLogLevel?: DatabaseAuditLogLevel
  hipaa?: boolean
  preloadLibraries?: DatabaseNamespacePreloadLibraries
}

/** Fields merged from Neon `ProjectListItem` (list API). */
interface DatabaseNamespaceFields {
  provisioner: DatabaseProvisioner
  defaultEndpointSettings?: DatabaseNamespaceDefaultEndpointSettings
  settings?: DatabaseNamespaceProjectSettings

  pgVersion: DatabasePgVersion
  proxyHost: string
  branchLogicalSizeLimit: number
  branchLogicalSizeLimitBytes: number
  storePasswords: boolean
  activeTime: number
  maintenanceStartsAt?: Date
  syntheticStorageSize?: number
  computeLastActiveAt?: Date
  historyRetentionSeconds?: number
  hipaaEnabledAt?: Date
  deletedAt?: Date
  recoverableUntil?: Date
}

/** Fields merged from Neon `Project` (get API). */
interface DatabaseNamespaceDetailFields {
  dataStorageBytesHour: number
  dataTransferBytes: number
  writtenDataBytes: number
  computeTimeSeconds: number
  activeTimeSeconds: number

  provisioner: DatabaseProvisioner
  defaultEndpointSettings?: DatabaseNamespaceDefaultEndpointSettings
  settings?: DatabaseNamespaceProjectSettings

  pgVersion: DatabasePgVersion
  proxyHost: string
  branchLogicalSizeLimit: number
  branchLogicalSizeLimitBytes: number
  storePasswords: boolean
  maintenanceStartsAt?: Date
  historyRetentionSeconds: number
  syntheticStorageSize?: number
  consumptionPeriodStart: Date
  consumptionPeriodEnd: Date
  computeLastActiveAt?: Date
  maintenanceScheduledFor?: Date
  hipaaEnabledAt?: Date
}

export type DatabaseNamespace = {
  id: string
  name: string
  isLowCost: boolean
  regionId: string
  createdAt: Date
  updatedAt: Date
} & DatabaseNamespaceFields & {
    branchCount: number
  }

export type DatabaseNamespaceDetail = {
  id: string
  name: string
  isLowCost: boolean
  regionId: string
  createdAt: Date
  updatedAt: Date
} & DatabaseNamespaceDetailFields

export interface DatabaseBranchRestrictedAction {
  name: string
  reason: string
}

export interface DatabaseBranch {
  id: string
  parentId?: string
  parentLsn?: string
  parentTimestamp?: Date
  name: string
  currentState: DatabaseBranchState
  pendingState?: DatabaseBranchState
  stateChangedAt: Date
  logicalSize?: number
  creationSource: string
  /** @deprecated Neon field; use `default` instead. */
  primary?: boolean
  default: boolean
  protected: boolean
  /** @deprecated Neon field. */
  cpuUsedSec: number
  computeTimeSeconds: number
  activeTimeSeconds: number
  writtenDataBytes: number
  dataTransferBytes: number
  createdAt: Date
  updatedAt: Date
  ttlIntervalSeconds?: number
  expiresAt?: Date
  lastResetAt?: Date
  initSource?: DatabaseBranchInitSource
  restoreStatus?: DatabaseBranchRestoreStatus
  restoredFrom?: string
  restoredAs?: string
  restrictedActions?: DatabaseBranchRestrictedAction[]
}

export interface DatabaseEndpointSettings {
  pgSettings?: DatabasePgSettings
  pgbouncerSettings?: DatabasePgbouncerSettings
  preloadLibraries?: DatabaseNamespacePreloadLibraries
}

export interface DatabaseEndpoint {
  host: string
  id: string
  name?: string
  branchId: string
  autoscalingLimitMinCu: DatabaseComputeUnit
  autoscalingLimitMaxCu: DatabaseComputeUnit
  regionId: string
  type: DatabaseEndpointType
  currentState: DatabaseEndpointState
  pendingState?: DatabaseEndpointState
  settings: DatabaseEndpointSettings
  poolerEnabled: boolean
  poolerMode: DatabaseEndpointPoolerMode
  disabled: boolean
  passwordlessAccess: boolean
  lastActive?: Date
  creationSource: string
  createdAt: Date
  updatedAt: Date
  startedAt?: Date
  suspendedAt?: Date
  proxyHost: string
  suspendTimeoutSeconds: DatabaseSuspendTimeoutSeconds
  provisioner: DatabaseProvisioner
  computeReleaseVersion?: string
}

export interface Database {
  id: number
  branchId: string
  name: string
  ownerName: string
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseRole {
  branchId: string
  name: string
  password?: string
  protected?: boolean
  authenticationMethod?: DatabaseRoleAuthenticationMethod
  createdAt: Date
  updatedAt: Date
}

/** Plan-level limits surfaced on the namespace dashboard (not all are Neon quota fields). */
export interface DatabaseNamespaceUsageLimits {
  maxBranches: number
  maxComputeCuHours: number
  maxStorageBytes: number
  maxDataTransferBytes: number
}

const LOW_COST_MAX_BRANCHES = 10
const NORMAL_MAX_BRANCHES = 100

/**
 * Derive dashboard usage limits from tier defaults and optional project quota overrides.
 */
export function getDatabaseNamespaceUsageLimits(
  isLowCost: boolean,
  quota?: DatabaseNamespaceQuota,
): DatabaseNamespaceUsageLimits {
  if (isLowCost) {
    return {
      maxBranches: LOW_COST_MAX_BRANCHES,
      maxComputeCuHours: (quota?.activeTimeSeconds ?? 360_000) / 3600,
      maxStorageBytes: quota?.logicalSizeBytes ?? 536_870_912,
      maxDataTransferBytes: quota?.dataTransferBytes ?? 5_368_709_120,
    }
  }

  return {
    maxBranches: NORMAL_MAX_BRANCHES,
    maxComputeCuHours: (quota?.activeTimeSeconds ?? 2_700_000) / 3600,
    maxStorageBytes: quota?.logicalSizeBytes ?? 10_737_418_240,
    maxDataTransferBytes: quota?.dataTransferBytes ?? 53_687_091_200,
  }
}

function stripInternalDatabaseNamespaceDetailFields(namespace: Neon): {
  id: string
  name: string
  isLowCost: boolean
  regionId: string
  createdAt: Date
  updatedAt: Date
} {
  const { accountId: _accountId, orgId: _orgId, projectId: _projectId, ...rest } = namespace
  return rest
}

function formatProjectQuota(quota: ProjectQuota): DatabaseNamespaceQuota {
  return {
    activeTimeSeconds: quota.active_time_seconds,
    computeTimeSeconds: quota.compute_time_seconds,
    writtenDataBytes: quota.written_data_bytes,
    dataTransferBytes: quota.data_transfer_bytes,
    logicalSizeBytes: quota.logical_size_bytes,
  }
}

function formatAllowedIps(allowedIps: AllowedIps): DatabaseNamespaceAllowedIps {
  return {
    ips: allowedIps.ips,
    protectedBranchesOnly: allowedIps.protected_branches_only,
  }
}

function formatMaintenanceWindow(window: MaintenanceWindow): DatabaseNamespaceMaintenanceWindow {
  return {
    weekdays: window.weekdays,
    startTime: window.start_time,
    endTime: window.end_time,
  }
}

function formatPreloadLibraries(libraries: PreloadLibraries): DatabaseNamespacePreloadLibraries {
  return {
    useDefaults: libraries.use_defaults,
    enabledLibraries: libraries.enabled_libraries,
  }
}

function formatDefaultEndpointSettings(
  settings: DefaultEndpointSettings,
): DatabaseNamespaceDefaultEndpointSettings {
  return {
    pgSettings: settings.pg_settings,
    pgbouncerSettings: settings.pgbouncer_settings,
    autoscalingLimitMinCu: settings.autoscaling_limit_min_cu,
    autoscalingLimitMaxCu: settings.autoscaling_limit_max_cu,
    suspendTimeoutSeconds: settings.suspend_timeout_seconds,
  }
}

function formatProjectSettings(settings: ProjectSettingsData): DatabaseNamespaceProjectSettings {
  return {
    quota: settings.quota ? formatProjectQuota(settings.quota) : undefined,
    allowedIps: settings.allowed_ips ? formatAllowedIps(settings.allowed_ips) : undefined,
    enableLogicalReplication: settings.enable_logical_replication,
    maintenanceWindow: settings.maintenance_window
      ? formatMaintenanceWindow(settings.maintenance_window)
      : undefined,
    blockPublicConnections: settings.block_public_connections,
    blockVpcConnections: settings.block_vpc_connections,
    auditLogLevel: settings.audit_log_level,
    hipaa: settings.hipaa,
    preloadLibraries: settings.preload_libraries
      ? formatPreloadLibraries(settings.preload_libraries)
      : undefined,
  }
}

function flattenDatabaseNamespaceFields(project: ProjectListItem): DatabaseNamespaceFields {
  return {
    provisioner: project.provisioner,
    defaultEndpointSettings: project.default_endpoint_settings
      ? formatDefaultEndpointSettings(project.default_endpoint_settings)
      : undefined,
    settings: project.settings ? formatProjectSettings(project.settings) : undefined,
    pgVersion: project.pg_version,
    proxyHost: project.proxy_host,
    branchLogicalSizeLimit: project.branch_logical_size_limit,
    branchLogicalSizeLimitBytes: project.branch_logical_size_limit_bytes,
    storePasswords: project.store_passwords,
    activeTime: project.active_time,
    maintenanceStartsAt: parseOptionalTimestamp(project.maintenance_starts_at),
    syntheticStorageSize: project.synthetic_storage_size,
    computeLastActiveAt: parseOptionalTimestamp(project.compute_last_active_at),
    historyRetentionSeconds: project.history_retention_seconds,
    hipaaEnabledAt: parseOptionalTimestamp(project.hipaa_enabled_at),
    deletedAt: parseOptionalTimestamp(project.deleted_at),
    recoverableUntil: parseOptionalTimestamp(project.recoverable_until),
  }
}

function flattenDatabaseNamespaceDetailFields(project: Project): DatabaseNamespaceDetailFields {
  return {
    dataStorageBytesHour: project.data_storage_bytes_hour,
    dataTransferBytes: project.data_transfer_bytes,
    writtenDataBytes: project.written_data_bytes,
    computeTimeSeconds: project.compute_time_seconds,
    activeTimeSeconds: project.active_time_seconds,
    provisioner: project.provisioner,
    defaultEndpointSettings: project.default_endpoint_settings
      ? formatDefaultEndpointSettings(project.default_endpoint_settings)
      : undefined,
    settings: project.settings ? formatProjectSettings(project.settings) : undefined,
    pgVersion: project.pg_version,
    proxyHost: project.proxy_host,
    branchLogicalSizeLimit: project.branch_logical_size_limit,
    branchLogicalSizeLimitBytes: project.branch_logical_size_limit_bytes,
    storePasswords: project.store_passwords,
    maintenanceStartsAt: parseOptionalTimestamp(project.maintenance_starts_at),
    historyRetentionSeconds: project.history_retention_seconds,
    syntheticStorageSize: project.synthetic_storage_size,
    consumptionPeriodStart: parseTimestamp(project.consumption_period_start),
    consumptionPeriodEnd: parseTimestamp(project.consumption_period_end),
    computeLastActiveAt: parseOptionalTimestamp(project.compute_last_active_at),
    maintenanceScheduledFor: parseOptionalTimestamp(project.maintenance_scheduled_for),
    hipaaEnabledAt: parseOptionalTimestamp(project.hipaa_enabled_at),
  }
}

export function formatNamespaceListItem(
  namespace: Neon,
  project: ProjectListItem,
  branchCount: number,
): DatabaseNamespace {
  return {
    ...stripInternalDatabaseNamespaceDetailFields(namespace),
    ...flattenDatabaseNamespaceFields(project),
    branchCount,
  }
}

export function formatNamespace(namespace: Neon, project: Project): DatabaseNamespaceDetail {
  return {
    ...stripInternalDatabaseNamespaceDetailFields(namespace),
    ...flattenDatabaseNamespaceDetailFields(project),
  }
}

function formatBranchRestrictedAction(
  action: BranchRestrictedAction,
): DatabaseBranchRestrictedAction {
  return {
    name: action.name,
    reason: action.reason,
  }
}

export function formatBranch(branch: Branch): DatabaseBranch {
  return {
    id: branch.id,
    parentId: branch.parent_id,
    parentLsn: branch.parent_lsn,
    parentTimestamp: parseOptionalTimestamp(branch.parent_timestamp),
    name: branch.name,
    currentState: branch.current_state,
    pendingState: branch.pending_state,
    stateChangedAt: parseTimestamp(branch.state_changed_at),
    logicalSize: branch.logical_size,
    creationSource: branch.creation_source,
    primary: branch.primary,
    default: branch.default,
    protected: branch.protected,
    cpuUsedSec: branch.cpu_used_sec,
    computeTimeSeconds: branch.compute_time_seconds,
    activeTimeSeconds: branch.active_time_seconds,
    writtenDataBytes: branch.written_data_bytes,
    dataTransferBytes: branch.data_transfer_bytes,
    createdAt: parseTimestamp(branch.created_at),
    updatedAt: parseTimestamp(branch.updated_at),
    ttlIntervalSeconds: branch.ttl_interval_seconds,
    expiresAt: parseOptionalTimestamp(branch.expires_at),
    lastResetAt: parseOptionalTimestamp(branch.last_reset_at),
    initSource: branch.init_source,
    restoreStatus: branch.restore_status,
    restoredFrom: branch.restored_from,
    restoredAs: branch.restored_as,
    restrictedActions: branch.restricted_actions?.map(formatBranchRestrictedAction),
  }
}

function formatEndpointSettings(settings: EndpointSettingsData): DatabaseEndpointSettings {
  return {
    pgSettings: settings.pg_settings,
    pgbouncerSettings: settings.pgbouncer_settings,
    preloadLibraries: settings.preload_libraries
      ? formatPreloadLibraries(settings.preload_libraries)
      : undefined,
  }
}

export function formatEndpoint(endpoint: Endpoint): DatabaseEndpoint {
  return {
    host: endpoint.host,
    id: endpoint.id,
    name: endpoint.name,
    branchId: endpoint.branch_id,
    autoscalingLimitMinCu: endpoint.autoscaling_limit_min_cu,
    autoscalingLimitMaxCu: endpoint.autoscaling_limit_max_cu,
    regionId: endpoint.region_id,
    type: endpoint.type,
    currentState: endpoint.current_state,
    pendingState: endpoint.pending_state,
    settings: formatEndpointSettings(endpoint.settings),
    poolerEnabled: endpoint.pooler_enabled,
    poolerMode: endpoint.pooler_mode,
    disabled: endpoint.disabled,
    passwordlessAccess: endpoint.passwordless_access,
    lastActive: parseOptionalTimestamp(endpoint.last_active),
    creationSource: endpoint.creation_source,
    createdAt: parseTimestamp(endpoint.created_at),
    updatedAt: parseTimestamp(endpoint.updated_at),
    startedAt: parseOptionalTimestamp(endpoint.started_at),
    suspendedAt: parseOptionalTimestamp(endpoint.suspended_at),
    proxyHost: endpoint.proxy_host,
    suspendTimeoutSeconds: endpoint.suspend_timeout_seconds,
    provisioner: endpoint.provisioner,
    computeReleaseVersion: endpoint.compute_release_version,
  }
}

export function formatBranchDatabase(database: NeonDatabase): Database {
  return {
    id: database.id,
    branchId: database.branch_id,
    name: database.name,
    ownerName: database.owner_name,
    createdAt: parseTimestamp(database.created_at),
    updatedAt: parseTimestamp(database.updated_at),
  }
}

export function formatRole(role: Role): DatabaseRole {
  return {
    branchId: role.branch_id,
    name: role.name,
    password: role.password,
    protected: role.protected,
    authenticationMethod: role.authentication_method,
    createdAt: parseTimestamp(role.created_at),
    updatedAt: parseTimestamp(role.updated_at),
  }
}

export function formatOperation(operation: Operation): DatabaseOperation {
  return {
    id: operation.id,
    branchId: operation.branch_id,
    endpointId: operation.endpoint_id,
    action: operation.action,
    status: operation.status,
    error: operation.error,
    failuresCount: operation.failures_count,
    retryAt: parseOptionalTimestamp(operation.retry_at),
    createdAt: parseTimestamp(operation.created_at),
    updatedAt: parseTimestamp(operation.updated_at),
    totalDurationMs: operation.total_duration_ms,
  }
}

function formatConnectionParameters(params: ConnectionParameters): DatabaseConnectionParameters {
  return {
    database: params.database,
    password: params.password,
    role: params.role,
    host: params.host,
    poolerHost: params.pooler_host,
  }
}

export function formatConnectionDetails(details: ConnectionDetails): DatabaseConnectionDetails {
  return {
    connectionUri: details.connection_uri,
    connectionParameters: formatConnectionParameters(details.connection_parameters),
  }
}
