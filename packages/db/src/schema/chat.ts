import type { InferSelectModel } from 'drizzle-orm'
import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { Agent } from './agent'
import { createdAt, timestamps, visibilityEnum, visibilityEnumValues } from './utils'
import { User } from './workspace'

export interface ChatMetadata {
  languageModel: string
  embeddingModel: string

  [key: string]: unknown
}

export const Chat = pgTable(
  'chat',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    title: text().notNull(),
    agentId: uuid()
      .notNull()
      .references(() => Agent.id),
    userId: uuid()
      .notNull()
      .references(() => User.id),
    metadata: jsonb().$type<ChatMetadata>().notNull(),
    visibility: visibilityEnum().notNull().default('private'),
    ...timestamps,
  },
  (table) => [
    index().on(table.agentId, table.userId),
    index().on(table.userId),
  ],
)

export type Chat = InferSelectModel<typeof Chat>

export const CreateChatSchema = createInsertSchema(Chat, {
  title: z.string(),
  userId: z.string(),
  metadata: z
    .object({
      languageModel: z.string(),
      embeddingModel: z.string(),
    })
    .catchall(z.unknown()),
  visibility: z.enum(visibilityEnumValues).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateChatSchema = createUpdateSchema(Chat, {
  id: z.string(),
  metadata: z
    .object({
      languageModel: z.string(),
      embeddingModel: z.string(),
    })
    .catchall(z.unknown()),
}).omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
})

export const message = pgTable('message', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  chatId: uuid()
    .notNull()
    .references(() => Chat.id),
  role: varchar().notNull(),
  content: jsonb().notNull(),
  createdAt,
})

export type Message = InferSelectModel<typeof message>

export const vote = pgTable(
  'vote',
  {
    chatId: uuid()
      .notNull()
      .references(() => Chat.id),
    messageId: uuid()
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    }
  },
)

export type Vote = InferSelectModel<typeof vote>
