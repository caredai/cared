import type { InferSelectModel } from 'drizzle-orm'
import { index, integer, jsonb, pgTable, primaryKey, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { App, DRAFT_VERSION } from './app'
import { timestamps, timestampsIndices, timestampsOmits } from './utils'

export interface AgentMetadata {
  description?: string
  imageUrl?: string

  [key: string]: unknown
}

const agentMetadataZod = z
  .object({
    description: z.string().optional(),
    imageUrl: z.string().optional(),
  })
  .catchall(z.unknown())
  .optional()

export const Agent = pgTable(
  'agent',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    appId: uuid()
      .notNull()
      .references(() => App.id),
    name: varchar({ length: 255 }).notNull(),
    metadata: jsonb('metadata').$type<AgentMetadata>().notNull().default({}),
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
  appId: z.string().uuid(),
  name: z.string().max(255),
  metadata: agentMetadataZod,
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateAgentSchema = createUpdateSchema(Agent, {
  id: z.string().uuid(),
  name: z.string().max(255).optional(),
  metadata: agentMetadataZod.optional(),
}).omit({
  appId: true,
  ...timestampsOmits,
})

export const AgentVersion = pgTable(
  'agent_version',
  {
    agentId: uuid()
      .notNull()
      .references(() => Agent.id),
    // Must be Unix timestamp of the publishing time.
    // DRAFT_VERSION indicates an unpublished draft.
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
  agentId: z.string().uuid(),
  version: z.number().int().optional(),
  name: z.string().max(255),
  metadata: agentMetadataZod,
}).omit({
  ...timestampsOmits,
})

export const UpdateAgentVersionSchema = createUpdateSchema(AgentVersion, {
  agentId: z.string(),
  version: z.number().int().optional(),
  name: z.string().max(255).optional(),
  metadata: agentMetadataZod,
}).omit({
  ...timestampsOmits,
})
