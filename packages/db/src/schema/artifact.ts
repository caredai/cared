import type { InferSelectModel } from 'drizzle-orm'
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { Chat } from './chat'
import { generateId, makeIdValid, timestamps, timestampsIndices, timestampsOmits } from './utils'
import { User } from './workspace'

export const artifactKinds = ['text', 'code', 'image', 'sheet'] as const
export type ArtifactKind = (typeof artifactKinds)[number]

export function generateArtifactId() {
  return generateId('art')
}

export const Artifact = pgTable(
  'artifact',
  {
    id: text().notNull().$defaultFn(generateArtifactId),
    version: integer().notNull(),
    userId: text()
      .notNull()
      .references(() => User.id),
    chatId: text()
      .notNull()
      .references(() => Chat.id),
    // Type of the artifact (e.g., 'image', 'text', 'code')
    kind: pgEnum('kind', artifactKinds)().notNull(),
    title: text('title').notNull(),
    content: jsonb().notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.id, table.version] }),
    index().on(table.userId, table.chatId, table.id),
    ...timestampsIndices(table),
  ],
)

export type Artifact = InferSelectModel<typeof Artifact>

export const CreateArtifactSchema = createInsertSchema(Artifact, {
  id: makeIdValid('art').optional(),
  userId: z.string(),
  chatId: z.string(),
  kind: z.string(),
  title: z.string(),
  content: z.record(z.unknown()),
}).omit({
  ...timestampsOmits,
})

export const UpdateArtifactSchema = createUpdateSchema(Artifact, {
  id: z.string(),
  kind: z.string().optional(),
  title: z.string().optional(),
  content: z.record(z.unknown()).optional(),
}).omit({
  userId: true,
  chatId: true,
  ...timestampsOmits,
})

export function generateArtifactSuggestionId() {
  return generateId('artsug')
}

export const ArtifactSuggestion = pgTable(
  'artifact',
  {
    id: text().primaryKey().notNull().$defaultFn(generateArtifactSuggestionId),
    artifactId: text().notNull(),
    artifactVersion: integer().notNull(),
    originalText: text().notNull(),
    suggestedText: text().notNull(),
    description: text(),
    isResolved: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.artifactId, table.artifactVersion],
      foreignColumns: [Artifact.id, Artifact.version],
    }),
    index().on(table.artifactId, table.artifactVersion),
    ...timestampsIndices(table),
  ],
)

export type ArtifactSuggestion = InferSelectModel<typeof ArtifactSuggestion>
