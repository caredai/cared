import { json, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { timestamps, visibilityEnum, visibilityEnumValues } from './utils'

export const Agent = pgTable('agent', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  name: varchar({ length: 256 }).notNull(),
  description: text(),
  type: varchar({ length: 64 }).notNull(),
  config: json().notNull(),
  visibility: visibilityEnum().notNull().default('private'),
  ...timestamps,
})

export const CreateAgentSchema = createInsertSchema(Agent, {
  name: z.string().max(256),
  description: z.string().optional(),
  type: z.string().max(64),
  config: z.record(z.unknown()),
  visibility: z.enum(visibilityEnumValues).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
