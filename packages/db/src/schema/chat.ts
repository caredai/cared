import type { InferSelectModel } from 'drizzle-orm'
import { boolean, index, json, pgTable, primaryKey, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { createdAt, timestamps, visibilityEnum, visibilityEnumValues } from './utils'
import { user } from './workspace'

export const chat = pgTable(
  'chat',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    title: text('title').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    visibility: visibilityEnum().notNull().default('private'),
    ...timestamps,
  },
  (table) => ({
    userIdIdx: index().on(table.userId),
  }),
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
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt,
})

export type Message = InferSelectModel<typeof message>

export const vote = pgTable(
  'vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    }
  },
)

export type Vote = InferSelectModel<typeof vote>
