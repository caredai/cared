import { json, pgTable, uuid, real, text } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { timestamps } from './utils'
import type { InferSelectModel } from 'drizzle-orm'

export const knowledge = pgTable('knowledge', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  content: text().notNull(),
  metadata: json(),
  embedding: real().array().$type<number[]>(),
  ...timestamps,
})

export type Knowledge = InferSelectModel<typeof knowledge>

export const CreateKnowledgeSchema = createInsertSchema(knowledge, {
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  embedding: z.array(z.number()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
