import type { LorebookEntry } from '@tavern/core'
import type { InferSelectModel } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { boolean, index, jsonb, pgTable, primaryKey, text } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@ownxai/sdk'

import { Character, CharGroup, Persona, User } from '.'

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
    lorebookId: text()
      .notNull()
      .references(() => Lorebook.id, { onDelete: 'cascade' }),
    chatId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.lorebookId, table.chatId] }),
    index().on(table.chatId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type LorebookToChat = InferSelectModel<typeof LorebookToChat>

export const LorebookToCharacter = pgTable(
  'lorebook_to_character',
  {
    lorebookId: text()
      .notNull()
      .references(() => Lorebook.id, { onDelete: 'cascade' }),
    characterId: text()
      .notNull()
      .references(() => Character.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    primary: boolean(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.lorebookId, table.characterId] }),
    index().on(table.characterId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type LorebookToCharacter = InferSelectModel<typeof LorebookToCharacter>

export const LorebookToGroup = pgTable(
  'lorebook_to_character_group',
  {
    lorebookId: text()
      .notNull()
      .references(() => Lorebook.id, { onDelete: 'cascade' }),
    groupId: text()
      .notNull()
      .references(() => CharGroup.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.lorebookId, table.groupId] }),
    index().on(table.groupId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type LorebookToGroup = InferSelectModel<typeof LorebookToGroup>

export const LorebookToPersona = pgTable(
  'lorebook_to_persona',
  {
    lorebookId: text()
      .notNull()
      .references(() => Lorebook.id, { onDelete: 'cascade' }),
    personaId: text()
      .notNull()
      .references(() => Persona.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.lorebookId, table.personaId] }),
    index().on(table.personaId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type LorebookToPersona = InferSelectModel<typeof LorebookToPersona>

// Relations for Lorebook
export const lorebookRelations = relations(Lorebook, ({ one, many }) => ({
  user: one(User, {
    fields: [Lorebook.userId],
    references: [User.id],
  }),
  lorebookToChats: many(LorebookToChat),
  lorebookToCharacters: many(LorebookToCharacter),
  lorebookToGroups: many(LorebookToGroup),
  lorebookToPersonas: many(LorebookToPersona),
}))

// Relations for LorebookToChat
export const lorebookToChatRelations = relations(LorebookToChat, ({ one }) => ({
  lorebook: one(Lorebook, {
    fields: [LorebookToChat.lorebookId],
    references: [Lorebook.id],
  }),
  user: one(User, {
    fields: [LorebookToChat.userId],
    references: [User.id],
  }),
}))

// Relations for LorebookToCharacter
export const lorebookToCharacterRelations = relations(LorebookToCharacter, ({ one }) => ({
  lorebook: one(Lorebook, {
    fields: [LorebookToCharacter.lorebookId],
    references: [Lorebook.id],
  }),
  character: one(Character, {
    fields: [LorebookToCharacter.characterId],
    references: [Character.id],
  }),
  user: one(User, {
    fields: [LorebookToCharacter.userId],
    references: [User.id],
  }),
}))

// Relations for LorebookToGroup
export const lorebookToGroupRelations = relations(LorebookToGroup, ({ one }) => ({
  lorebook: one(Lorebook, {
    fields: [LorebookToGroup.lorebookId],
    references: [Lorebook.id],
  }),
  group: one(CharGroup, {
    fields: [LorebookToGroup.groupId],
    references: [CharGroup.id],
  }),
  user: one(User, {
    fields: [LorebookToGroup.userId],
    references: [User.id],
  }),
}))

// Relations for LorebookToPersona
export const lorebookToPersonaRelations = relations(LorebookToPersona, ({ one }) => ({
  lorebook: one(Lorebook, {
    fields: [LorebookToPersona.lorebookId],
    references: [Lorebook.id],
  }),
  persona: one(Persona, {
    fields: [LorebookToPersona.personaId],
    references: [Persona.id],
  }),
  user: one(User, {
    fields: [LorebookToPersona.userId],
    references: [User.id],
  }),
}))
