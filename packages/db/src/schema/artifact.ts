import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { Chat } from './chat'
import { generateId, makeIdValid, timestamps, timestampsIndices, timestampsOmits } from './utils'
import { User } from './workspace'

export const artifactTypes = ['text', 'code', 'image', 'sheet']
export type ArtifactType = (typeof artifactTypes)[number]

export const Artifact = pgTable(
  'artifact',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('art')),
    userId: text()
      .notNull()
      .references(() => User.id),
    chatId: text()
      .notNull()
      .references(() => Chat.id),
    // Type of the artifact (e.g., 'image', 'text', 'code')
    type: varchar({ length: 15 }).notNull(),
    content: jsonb().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId, table.chatId),
    ...timestampsIndices(table),
  ],
)

export type Artifact = InferSelectModel<typeof Artifact>

export const CreateArtifactSchema = createInsertSchema(Artifact, {
  id: makeIdValid('art').optional(),
  userId: z.string(),
  chatId: z.string(),
  type: z.string(),
  content: z.record(z.unknown()),
}).omit({
  ...timestampsOmits,
})

export const UpdateArtifactSchema = createUpdateSchema(Artifact, {
  id: z.string(),
  type: z.string().optional(),
  content: z.record(z.unknown()).optional(),
}).omit({
  userId: true,
  chatId: true,
  ...timestampsOmits,
})
