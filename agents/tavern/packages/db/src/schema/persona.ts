import type { PersonaMetadata } from '@tavern/core'
import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text, primaryKey, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

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

// Relations for Persona
export const personaRelations = relations(Persona, ({ one, many }) => ({
  user: one(User, {
    fields: [Persona.userId],
    references: [User.id],
  }),
  personaToCharacters: many(PersonaToCharacter),
  personaToGroups: many(PersonaToGroup),
  personaToChats: many(PersonaToChat),
}))

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
    unique().on(table.characterId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type PersonaToCharacter = InferSelectModel<typeof PersonaToCharacter>

// Relations for PersonaToCharacter
export const personaToCharacterRelations = relations(PersonaToCharacter, ({ one }) => ({
  persona: one(Persona, {
    fields: [PersonaToCharacter.personaId],
    references: [Persona.id],
  }),
  character: one(Character, {
    fields: [PersonaToCharacter.characterId],
    references: [Character.id],
  }),
  user: one(User, {
    fields: [PersonaToCharacter.userId],
    references: [User.id],
  }),
}))

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
    unique().on(table.groupId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type PersonaToGroup = InferSelectModel<typeof PersonaToGroup>

// Relations for PersonaToGroup
export const personaToGroupRelations = relations(PersonaToGroup, ({ one }) => ({
  persona: one(Persona, {
    fields: [PersonaToGroup.personaId],
    references: [Persona.id],
  }),
  group: one(CharGroup, {
    fields: [PersonaToGroup.groupId],
    references: [CharGroup.id],
  }),
  user: one(User, {
    fields: [PersonaToGroup.userId],
    references: [User.id],
  }),
}))

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

// Relations for PersonaToChat
export const personaToChatRelations = relations(PersonaToChat, ({ one }) => ({
  persona: one(Persona, {
    fields: [PersonaToChat.personaId],
    references: [Persona.id],
  }),
  user: one(User, {
    fields: [PersonaToChat.userId],
    references: [User.id],
  }),
}))
