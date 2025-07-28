import type { CharacterCardV3, CharacterMetadata } from '@tavern/core'
import type { InferSelectModel } from 'drizzle-orm'
import { characterCardV3Schema, characterMetadataSchema } from '@tavern/core'
import { index, jsonb, pgEnum, pgTable, primaryKey, text, unique } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

import {
  generateId,
  makeIdValid,
  makeObjectNonempty,
  timestamps,
  timestampsIndices,
  timestampsOmits,
} from '@cared/sdk'

import { User } from '.'

export const characterSourceEnumValues = [
  'create', // the character is created by the user
  'import-file', // the character is imported from a file
  'import-url', // the character is imported from a url
  'nft-owned', // the character is nft and owned by the user
  'nft-link', // the character is linked from another character nft
] as const

export const characterSourceEnum = pgEnum('source', characterSourceEnumValues)

export const Character = pgTable(
  'character',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('char')),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    source: characterSourceEnum().notNull().default('create'),
    // the nft token id of the character (if the character is nft)
    nftId: text(),
    content: jsonb().$type<CharacterCardV3>().notNull(),
    metadata: jsonb().$type<CharacterMetadata>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId, table.source),
    index().on(table.nftId, table.source),
    ...timestampsIndices(table),
  ],
)

export type Character = InferSelectModel<typeof Character>

export const CreateCharacterSchema = createInsertSchema(Character, {
  id: makeIdValid('char').optional(),
  userId: z.string(),
  source: z.enum(characterSourceEnumValues),
  nftId: z.string().optional(),
  content: characterCardV3Schema,
  metadata: characterMetadataSchema,
}).omit({
  ...timestampsOmits,
})

export const UpdateCharacterSchema = createUpdateSchema(Character, {
  id: z.string(),
  content: z.unknown().optional(),
  metadata: makeObjectNonempty(characterMetadataSchema),
}).omit({
  userId: true,
  source: true,
  nftId: true,
  ...timestampsOmits,
})

export const CharacterChat = pgTable(
  'character_chat',
  {
    characterId: text()
      .notNull()
      .references(() => Character.id, { onDelete: 'cascade' }),
    chatId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.characterId, table.chatId] }),
    unique().on(table.chatId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type CharacterChat = InferSelectModel<typeof CharacterChat>
