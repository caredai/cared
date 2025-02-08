import type { InferSelectModel } from 'drizzle-orm'
import { boolean, index, json, pgTable, primaryKey, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agent } from './agent'
import { createdAt, timestamps, visibilityEnum, visibilityEnumValues } from './utils'
import { user } from './workspace'

export const chat = pgTable(
  'chat',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    title: text().notNull(),
    agentId: uuid()
      .notNull()
      .references(() => agent.id),
    userId: uuid()
      .notNull()
      .references(() => user.id),
    visibility: visibilityEnum().notNull().default('private'),
    ...timestamps,
  },
  (table) => [
    index().on(table.agentId, table.userId),
    index().on(table.userId),
  ],
)

export type Chat = InferSelectModel<typeof chat>

export const CreateChatSchema = createInsertSchema(chat, {
  title: z.string(),
  userId: z.string(),
  visibility: z.enum(visibilityEnumValues).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateChatSchema = createUpdateSchema(chat, {
  id: z.string(),
}).omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
})

export const message = pgTable('message', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  chatId: uuid()
    .notNull()
    .references(() => chat.id),
  role: varchar().notNull(),
  content: json().notNull(),
  createdAt,
})

export type Message = InferSelectModel<typeof message>

export const vote = pgTable(
  'vote',
  {
    chatId: uuid()
      .notNull()
      .references(() => chat.id),
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
