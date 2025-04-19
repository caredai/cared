import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgEnum, pgTable, text, unique, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import {
  generateId,
  makeIdValid,
  makeObjectNonempty,
  timestamps,
  timestampsIndices,
  timestampsOmits,
} from '@ownxai/sdk'

export const characterSourceEnumValues = [
  'create', // the character is created by the user
  'import-file', // the character is imported from a file
  'import-url', // the character is imported from an url
  'purchase', // the character is nft and purchased by the user
  'link', // the character is linked from another character
  'copy', // the character is copied from another character
] as const

export const characterSourceEnum = pgEnum('source', characterSourceEnumValues)

export interface CharacterMetadata {
  filename: string // with file extension
  url: string // the url of the file stored in the object storage
  fromUrl?: string // the url of the imported character

  custom?: unknown
}

export const characterMetadataSchema = z.object({
  filename: z.string(),
  url: z.string(),
  fromUrl: z.string().optional(),
  custom: z.unknown().optional(),
})

export const Character = pgTable(
  'character',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('char')),
    userId: varchar({ length: 127 }).notNull(),
    source: characterSourceEnum().notNull().default('create'),
    // the nft token id of the character (if the character is nft)
    nftId: text(),
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
  metadata: characterMetadataSchema,
}).omit({
  ...timestampsOmits,
})

export const UpdateCharacterSchema = createUpdateSchema(Character, {
  id: z.string(),
  metadata: makeObjectNonempty(characterMetadataSchema),
}).omit({
  userId: true,
  source: true,
  nftId: true,
  ...timestampsOmits,
})

export const CharacterToChat = pgTable(
  'character_to_chat',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('charchat')),
    characterId: text()
      .notNull()
      .references(() => Character.id),
    chatId: text().notNull(),
    userId: varchar({ length: 127 }).notNull(),
    ...timestamps,
  },
  (table) => [
    unique().on(table.characterId, table.chatId),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type CharacterToChat = InferSelectModel<typeof CharacterToChat>
