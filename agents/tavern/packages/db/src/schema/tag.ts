import type { InferSelectModel } from 'drizzle-orm'
import { index, pgTable, primaryKey, text } from 'drizzle-orm/pg-core'

import { timestamps, timestampsIndices } from '@ownxai/sdk'

import { Character } from './character'

export const Tag = pgTable(
  'tag',
  {
    name: text().primaryKey().notNull(),
    ...timestamps,
  },
  (table) => [
    ...timestampsIndices(table),
  ],
)

export type Tag = InferSelectModel<typeof Tag>

export const CharsToTags = pgTable(
  'characters_to_tags',
  {
    characterId: text()
      .notNull()
      .references(() => Character.id, { onDelete: 'cascade' }),
    tag: text()
      .notNull()
      .references(() => Tag.name, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.characterId, table.tag] }),
    index().on(table.tag),
    ...timestampsIndices(table),
  ],
)

export type CharsToTags = InferSelectModel<typeof CharsToTags>
