import type { LorebookEntry } from '@tavern/core'
import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@ownxai/sdk'

import { Character, Group, User } from '.'

export const Lorebook = pgTable(
  'lorebook',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('lb')),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    description: text(),
    entries: jsonb().$type<LorebookEntry[]>().notNull(),
    metadata: jsonb(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type Lorebook = InferSelectModel<typeof Lorebook>

export const LorebookToChat = pgTable(
  'lorebook_to_chat',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('lc')),
    lorebookId: text()
      .notNull()
      .references(() => Lorebook.id),
    chatId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    index().on(table.lorebookId, table.chatId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type LorebookToChat = InferSelectModel<typeof LorebookToChat>

export const LorebookToCharacter = pgTable(
  'lorebook_to_character',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('lc')),
    lorebookId: text()
      .notNull()
      .references(() => Lorebook.id),
    characterId: text()
      .notNull()
      .references(() => Character.id),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    index().on(table.lorebookId, table.characterId),
    index().on(table.characterId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type LorebookToCharacter = InferSelectModel<typeof LorebookToCharacter>

export const LorebookToGroup = pgTable(
  'lorebook_to_group',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('lg')),
    lorebookId: text()
      .notNull()
      .references(() => Lorebook.id),
    groupId: text()
      .notNull()
      .references(() => Group.id),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    index().on(table.lorebookId, table.groupId),
    index().on(table.groupId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type LorebookToGroup = InferSelectModel<typeof LorebookToGroup>
