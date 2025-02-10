import { index, json, pgTable, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { App } from './app'
import {
  timestamps,
  timestampsIndices,
  timestampsOmits,
  visibilityEnum,
  visibilityEnumValues,
} from './utils'

export interface AgentMetadata {
  description?: string

  [key: string]: unknown
}

export const agent = pgTable(
  'agent',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    appId: uuid()
      .notNull()
      .references(() => App.id),
    name: varchar({ length: 255 }).notNull(),
    metadata: json('metadata').$type<AgentMetadata>().notNull().default({}),
    visibility: visibilityEnum().notNull().default('private'),
    ...timestamps,
  },
  (table) => [
    index().on(table.appId),
    index().on(table.name),
    ...timestampsIndices(table),
  ],
)

export const CreateAgentSchema = createInsertSchema(agent, {
  appId: z.string().uuid(),
  name: z.string().max(255),
  metadata: z
    .object({
      description: z.string().optional(),
    })
    .catchall(z.unknown()),
  visibility: z.enum(visibilityEnumValues).optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})
