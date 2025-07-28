import type { CharGroupMetadata } from '@tavern/core'
import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, primaryKey, text, unique } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@cared/sdk'

import { User } from '.'

export const CharGroup = pgTable(
  'character_group',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('charg')),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    characters: jsonb().$type<string[]>().notNull(), // Array of character references
    metadata: jsonb().$type<CharGroupMetadata>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type CharGroup = InferSelectModel<typeof CharGroup>

export const CharGroupChat = pgTable(
  'character_group_chat',
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
