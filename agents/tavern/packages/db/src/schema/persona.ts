import type { PersonaMetadata } from '@tavern/core'
import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text, primaryKey, unique } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@ownxai/sdk'

import { Character, CharGroup, User } from '.'

export const Persona = pgTable(
  'persona',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('ps')),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    metadata: jsonb().$type<PersonaMetadata>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type Persona = InferSelectModel<typeof Persona>

export const PersonaToCharacter = pgTable(
  'persona_to_character',
  {
    personaId: text()
      .notNull()
      .references(() => Persona.id, { onDelete: 'cascade' }),
    characterId: text()
      .notNull()
      .references(() => Character.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.personaId, table.characterId] }),
    index().on(table.characterId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type PersonaToCharacter = InferSelectModel<typeof PersonaToCharacter>

export const PersonaToGroup = pgTable(
  'persona_to_character_group',
  {
    personaId: text()
      .notNull()
      .references(() => Persona.id, { onDelete: 'cascade' }),
    groupId: text()
      .notNull()
      .references(() => CharGroup.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.personaId, table.groupId] }),
    index().on(table.groupId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type PersonaToGroup = InferSelectModel<typeof PersonaToGroup>

export const PersonaToChat = pgTable(
  'persona_to_chat',
  {
    personaId: text()
      .notNull()
      .references(() => Persona.id, { onDelete: 'cascade' }),
    chatId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.personaId, table.chatId] }),
    unique().on(table.chatId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type PersonaToChat = InferSelectModel<typeof PersonaToChat>
