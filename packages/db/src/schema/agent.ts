import { json, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { timestamps, visibilityEnum, visibilityEnumValues } from './utils'

export const agent = pgTable('agent', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  type: varchar({ length: 63 }).notNull(),
  config: json().notNull(),
  visibility: visibilityEnum().notNull().default('private'),
  ...timestamps,
})

export const CreateAgentSchema = createInsertSchema(agent, {
  name: z.string().max(255),
  description: z.string().optional(),
  type: z.string().max(63),
  config: z.record(z.unknown()),
  visibility: z.enum(visibilityEnumValues).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
