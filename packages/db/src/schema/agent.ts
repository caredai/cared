import type { InferSelectModel } from 'drizzle-orm'
import { index, integer, jsonb, pgTable, primaryKey, text, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { App, DRAFT_VERSION } from './app'
import { generateId, timestamps, timestampsIndices, timestampsOmits } from './utils'

export interface AgentMetadata {
  description?: string
  imageUrl?: string

  languageModel?: string
  embeddingModel?: string // used for embedding memories
  rerankModel?: string // used for reranking memories

  languageModelSettings?: {
    systemPrompt?: string
  }

  datasetBindings?: string[]

  [key: string]: unknown
}

const agentMetadataZod = z
  .object({
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    languageModel: z.string().optional(),
    embeddingModel: z.string().optional(),
    rerankModel: z.string().optional(),
    languageModelSettings: z
      .object({
        systemPrompt: z.string().optional(),
      })
      .optional(),
  })
  .catchall(z.unknown())

export const Agent = pgTable(
  'agent',
  {
    id: text().primaryKey().notNull().$defaultFn(() => generateId('agent')),
    appId: text()
      .notNull()
      .references(() => App.id),
    name: varchar({ length: 255 }).notNull(),
    metadata: jsonb().$type<AgentMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.appId),
    index().on(table.name),
    ...timestampsIndices(table),
  ],
)

export type Agent = InferSelectModel<typeof Agent>

export const CreateAgentSchema = createInsertSchema(Agent, {
  appId: z.string(),
  name: z.string().max(255),
  metadata: agentMetadataZod.optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateAgentSchema = createUpdateSchema(Agent, {
  id: z.string(),
  name: z.string().max(255).optional(),
  metadata: agentMetadataZod.optional(),
}).omit({
  appId: true,
  ...timestampsOmits,
})

export const AgentVersion = pgTable(
  'agent_version',
  {
    agentId: text()
      .notNull()
      .references(() => Agent.id),
    // Must be Unix timestamp of the publishing time.
    // DRAFT_VERSION indicates an unpublished draft.
    // The version always corresponds to an app version of the app that the agent belongs to.
    version: integer().notNull().default(DRAFT_VERSION),
    name: varchar({ length: 255 }).notNull(),
    metadata: jsonb().$type<AgentMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.agentId, table.version] }),
    ...timestampsIndices(table),
  ],
)

export type AgentVersion = InferSelectModel<typeof AgentVersion>

export const CreateAgentVersionSchema = createInsertSchema(AgentVersion, {
  agentId: z.string(),
  version: z.number().int().optional(),
  name: z.string().max(255),
  metadata: agentMetadataZod.optional(),
}).omit({
  ...timestampsOmits,
})

export const UpdateAgentVersionSchema = createUpdateSchema(AgentVersion, {
  agentId: z.string(),
  version: z.number().int().optional(),
  name: z.string().max(255).optional(),
  metadata: agentMetadataZod.optional(),
}).omit({
  ...timestampsOmits,
})
