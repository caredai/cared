import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, primaryKey, text, unique } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import {
  generateId,
  makeObjectNonempty,
  timestamps,
  timestampsIndices,
  timestampsOmits,
} from '@ownxai/sdk'

import { User } from '.'

export interface CharGroupMetadata {
  custom?: unknown
}

export const charGroupMetadataSchema = z.object({
  custom: z.unknown().optional(),
})

export const CharGroup = pgTable(
  'char_group',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('charg')),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    characters: jsonb().$type<string[]>().notNull(), // Array of character references
    metadata: jsonb().$type<CharGroupMetadata>(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type CharGroup = InferSelectModel<typeof CharGroup>

export const CreateCharGroupSchema = createInsertSchema(CharGroup, {
  userId: z.string(),
  characters: z.array(z.string()).min(1),
  metadata: charGroupMetadataSchema.optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateCharGroupSchema = createUpdateSchema(CharGroup, {
  id: z.string(),
  characters: z.array(z.any()).optional(),
  metadata: makeObjectNonempty(charGroupMetadataSchema).optional(),
}).omit({
  userId: true,
  ...timestampsOmits,
})

export const CharGroupChat = pgTable(
  'char_group_chat',
  {
    groupId: text()
      .notNull()
      .references(() => CharGroup.id, { onDelete: 'cascade' }),
    chatId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.chatId] }),
    unique().on(table.chatId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type CharGroupChat = InferSelectModel<typeof CharGroupChat>
