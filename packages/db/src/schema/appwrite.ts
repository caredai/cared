import type { InferSelectModel } from 'drizzle-orm'
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

import { Account } from './auth-alias'
import { timestamps, timestampsIndices } from './utils'

export const appwriteResourceSyncStatuses = [
  'pending',
  'syncing',
  'ready',
  'failed',
  'disabled',
] as const
export type AppwriteResourceSyncStatus = (typeof appwriteResourceSyncStatuses)[number]
export const appwriteResourceSyncStatusEnum = pgEnum(
  'appwriteResourceSyncStatus',
  appwriteResourceSyncStatuses,
)

export const appwriteSiteDeploymentModes = ['single_region', 'global'] as const
export type AppwriteSiteDeploymentMode = (typeof appwriteSiteDeploymentModes)[number]
export const appwriteSiteDeploymentModeEnum = pgEnum(
  'appwriteSiteDeploymentMode',
  appwriteSiteDeploymentModes,
)

export const appwriteResourceTypes = ['function', 'site'] as const
export type AppwriteResourceType = (typeof appwriteResourceTypes)[number]
export const appwriteResourceTypeEnum = pgEnum('appwriteResourceType', appwriteResourceTypes)

export const appwriteDeploymentStatuses = [
  'pending',
  'building_primary',
  'primary_ready',
  'syncing_regions',
  'ready',
  'partial_failed',
  'failed',
  'canceled',
] as const
export type AppwriteDeploymentStatus = (typeof appwriteDeploymentStatuses)[number]
export const appwriteDeploymentStatusEnum = pgEnum(
  'appwriteDeploymentStatus',
  appwriteDeploymentStatuses,
)

export const appwriteDeploymentRegionStatuses = [
  'pending',
  'building',
  'ready',
  'failed',
  'canceled',
  'skipped',
] as const
export type AppwriteDeploymentRegionStatus = (typeof appwriteDeploymentRegionStatuses)[number]
export const appwriteDeploymentRegionStatusEnum = pgEnum(
  'appwriteDeploymentRegionStatus',
  appwriteDeploymentRegionStatuses,
)

export const appwriteRuleTriggerTypes = ['deployment', 'manual'] as const
export type AppwriteRuleTriggerType = (typeof appwriteRuleTriggerTypes)[number]
export const appwriteRuleTriggerTypeEnum = pgEnum(
  'appwriteRuleTriggerType',
  appwriteRuleTriggerTypes,
)

export const appwriteRuleStatuses = [
  'pending',
  'applying',
  'ready',
  'failed',
  'disabled',
] as const
export type AppwriteRuleStatus = (typeof appwriteRuleStatuses)[number]
export const appwriteRuleStatusEnum = pgEnum('appwriteRuleStatus', appwriteRuleStatuses)

export type AppwriteResourceMetadata = Record<string, unknown>

export const AppwriteRegion = pgTable(
  'appwrite_region',
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    enabled: boolean().notNull().default(true),
    metadata: jsonb().$type<AppwriteResourceMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [index().on(table.enabled), ...timestampsIndices(table)],
)

export const AppwriteFunction = pgTable(
  'appwrite_function',
  {
    id: text().primaryKey().notNull(),
    accountId: text()
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    primaryRegionId: text()
      .notNull()
      .references(() => AppwriteRegion.id, { onDelete: 'restrict' }),
    activeDeploymentId: text(),
    runtime: text().notNull(),
    enabled: boolean().notNull().default(true),
    metadata: jsonb().$type<AppwriteResourceMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId),
    index().on(table.primaryRegionId),
    ...timestampsIndices(table),
  ],
)

export const AppwriteFunctionRegion = pgTable(
  'appwrite_function_region',
  {
    functionId: text()
      .notNull()
      .references(() => AppwriteFunction.id, { onDelete: 'cascade' }),
    regionId: text()
      .notNull()
      .references(() => AppwriteRegion.id, { onDelete: 'restrict' }),
    syncStatus: appwriteResourceSyncStatusEnum().notNull().default('pending'),
    lastSyncedAt: timestamp({ withTimezone: true }),
    syncError: text(),
    ...timestamps,
  },
  (table) => [
    index().on(table.functionId),
    index().on(table.regionId),
    index().on(table.syncStatus),
    unique().on(table.functionId, table.regionId),
    ...timestampsIndices(table),
  ],
)

export const AppwriteSite = pgTable(
  'appwrite_site',
  {
    id: text().primaryKey().notNull(),
    accountId: text()
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    primaryRegionId: text()
      .notNull()
      .references(() => AppwriteRegion.id, { onDelete: 'restrict' }),
    activeDeploymentId: text(),
    framework: text().notNull(),
    deploymentMode: appwriteSiteDeploymentModeEnum().notNull(),
    enabled: boolean().notNull().default(true),
    metadata: jsonb().$type<AppwriteResourceMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId),
    index().on(table.primaryRegionId),
    index().on(table.deploymentMode),
    ...timestampsIndices(table),
  ],
)

export const AppwriteSiteRegion = pgTable(
  'appwrite_site_region',
  {
    siteId: text()
      .notNull()
      .references(() => AppwriteSite.id, { onDelete: 'cascade' }),
    regionId: text()
      .notNull()
      .references(() => AppwriteRegion.id, { onDelete: 'restrict' }),
    syncStatus: appwriteResourceSyncStatusEnum().notNull().default('pending'),
    lastSyncedAt: timestamp({ withTimezone: true }),
    syncError: text(),
    ...timestamps,
  },
  (table) => [
    index().on(table.siteId),
    index().on(table.regionId),
    index().on(table.syncStatus),
    unique().on(table.siteId, table.regionId),
    ...timestampsIndices(table),
  ],
)

export const AppwriteDeployment = pgTable(
  'appwrite_deployment',
  {
    id: text().primaryKey().notNull(),
    accountId: text()
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    resourceType: appwriteResourceTypeEnum().notNull(),
    resourceId: text().notNull(),
    primaryRegionId: text()
      .notNull()
      .references(() => AppwriteRegion.id, { onDelete: 'restrict' }),
    active: boolean().notNull().default(false),
    status: appwriteDeploymentStatusEnum().notNull().default('pending'),
    error: text(),
    metadata: jsonb().$type<AppwriteResourceMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId),
    index().on(table.resourceType, table.resourceId),
    index().on(table.primaryRegionId),
    index().on(table.status),
    ...timestampsIndices(table),
  ],
)

export const AppwriteDeploymentRegion = pgTable(
  'appwrite_deployment_region',
  {
    deploymentId: text()
      .notNull()
      .references(() => AppwriteDeployment.id, { onDelete: 'cascade' }),
    regionId: text()
      .notNull()
      .references(() => AppwriteRegion.id, { onDelete: 'restrict' }),
    workflowId: text(),
    status: appwriteDeploymentRegionStatusEnum().notNull().default('pending'),
    error: text(),
    startedAt: timestamp({ withTimezone: true }),
    finishedAt: timestamp({ withTimezone: true }),
    lastSyncedAt: timestamp({ withTimezone: true }),
    metadata: jsonb().$type<AppwriteResourceMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.deploymentId),
    index().on(table.regionId),
    index().on(table.workflowId),
    index().on(table.status),
    unique().on(table.deploymentId, table.regionId),
    ...timestampsIndices(table),
  ],
)

export const AppwriteRule = pgTable(
  'appwrite_rule',
  {
    id: text().primaryKey().notNull(),
    accountId: text()
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    resourceType: appwriteResourceTypeEnum().notNull(),
    resourceId: text().notNull(),
    triggerType: appwriteRuleTriggerTypeEnum().notNull(),
    domain: text().notNull(),
    status: appwriteRuleStatusEnum().notNull().default('pending'),
    error: text(),
    metadata: jsonb().$type<AppwriteResourceMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId),
    index().on(table.resourceType, table.resourceId),
    index().on(table.triggerType),
    index().on(table.status),
    index().on(table.domain),
    ...timestampsIndices(table),
  ],
)

export const AppwriteRuleRegion = pgTable(
  'appwrite_rule_region',
  {
    ruleId: text()
      .notNull()
      .references(() => AppwriteRule.id, { onDelete: 'cascade' }),
    regionId: text()
      .notNull()
      .references(() => AppwriteRegion.id, { onDelete: 'restrict' }),
    workflowId: text(),
    status: appwriteRuleStatusEnum().notNull().default('pending'),
    verificationStatus: text(),
    certificateStatus: text(),
    error: text(),
    metadata: jsonb().$type<AppwriteResourceMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.ruleId),
    index().on(table.regionId),
    index().on(table.workflowId),
    index().on(table.status),
    unique().on(table.ruleId, table.regionId),
    ...timestampsIndices(table),
  ],
)

export type AppwriteRegion = InferSelectModel<typeof AppwriteRegion>
export type AppwriteFunction = InferSelectModel<typeof AppwriteFunction>
export type AppwriteFunctionRegion = InferSelectModel<typeof AppwriteFunctionRegion>
export type AppwriteSite = InferSelectModel<typeof AppwriteSite>
export type AppwriteSiteRegion = InferSelectModel<typeof AppwriteSiteRegion>
export type AppwriteDeployment = InferSelectModel<typeof AppwriteDeployment>
export type AppwriteDeploymentRegion = InferSelectModel<typeof AppwriteDeploymentRegion>
export type AppwriteRule = InferSelectModel<typeof AppwriteRule>
export type AppwriteRuleRegion = InferSelectModel<typeof AppwriteRuleRegion>
