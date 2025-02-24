import type { InferSelectModel } from 'drizzle-orm'
import { index, integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { AgentVersion } from './agent'
import { AppVersion } from './app'
import { Dataset } from './dataset'
import { timestamps, timestampsIndices, timestampsOmits } from './utils'

// Binding table between AppVersion and Dataset
export const AppVersionToDataset = pgTable(
  'app_version_to_dataset',
  {
    appId: text()
      .notNull()
      .references(() => AppVersion.appId),
    version: integer()
      .notNull()
      .references(() => AppVersion.version),
    datasetId: text()
      .notNull()
      .references(() => Dataset.id),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.version, table.datasetId] }),
    index().on(table.datasetId),
    ...timestampsIndices(table),
  ],
)

export type AppVersionToDataset = InferSelectModel<typeof AppVersionToDataset>

export const CreateAppVersionToDatasetSchema = createInsertSchema(AppVersionToDataset, {
  appId: z.string(),
  version: z.number().int(),
  datasetId: z.string(),
}).omit({
  ...timestampsOmits,
})

// Binding table between AgentVersion and Dataset
export const AgentVersionToDataset = pgTable(
  'agent_version_to_dataset',
  {
    agentId: text()
      .notNull()
      .references(() => AgentVersion.agentId),
    version: integer()
      .notNull()
      .references(() => AgentVersion.version),
    datasetId: text()
      .notNull()
      .references(() => Dataset.id),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.agentId, table.version, table.datasetId] }),
    index().on(table.datasetId),
    ...timestampsIndices(table),
  ],
)

export type AgentVersionToDataset = InferSelectModel<typeof AgentVersionToDataset>

export const CreateAgentVersionToDatasetSchema = createInsertSchema(AgentVersionToDataset, {
  agentId: z.string(),
  version: z.number().int(),
  datasetId: z.string(),
}).omit({
  ...timestampsOmits,
})
