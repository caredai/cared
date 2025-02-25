import type { CoreMessage } from 'ai'
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

import { Agent } from './agent'
import { App, AppVersion } from './app'
import {
  generateId, makeIdValid,
  makeObjectNonempty,
  timestamps,
  timestampsIndices,
  timestampsOmits,
  visibilityEnumValues,
} from './utils'
import { User } from './workspace'

export interface ChatMetadata {
  title: string
  visibility: 'public' | 'private'

  languageModel?: string
  embeddingModel?: string // used for embedding memories
  rerankModel?: string // used for reranking memories

  [key: string]: unknown
}

const chatMetadataZod = z
  .object({
    title: z.string(),
    visibility: z.enum(visibilityEnumValues),
    languageModel: z.string().optional(),
    embeddingModel: z.string().optional(),
    rerankModel: z.string().optional(),
  })
  .catchall(z.unknown())

export const Chat = pgTable(
  'chat',
  {
    id: text().primaryKey().notNull().$defaultFn(() => generateId('chat')),
    appId: text()
      .notNull()
      .references(() => App.id),
    appVersion: integer().notNull(),
    userId: text()
      .notNull()
      .references(() => User.id),
    metadata: jsonb().$type<ChatMetadata>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.appId, table.appVersion),
    foreignKey({
      columns: [table.appId, table.appVersion],
      foreignColumns: [AppVersion.appId, AppVersion.version],
    }),
    index().on(table.userId, table.appId, table.appVersion),
  ],
)

export type Chat = InferSelectModel<typeof Chat>

export const CreateChatSchema = createInsertSchema(Chat, {
  id: makeIdValid('chat').optional(),
  appId: z.string(),
  appVersion: z.number().int(),
  userId: z.string(),
  metadata: chatMetadataZod,
}).omit({
  ...timestampsOmits,
})

export const UpdateChatSchema = createUpdateSchema(Chat, {
  id: z.string(),
  metadata: makeObjectNonempty(chatMetadataZod).optional(),
}).omit({
  appId: true,
  appVersion: true,
  userId: true,
  ...timestampsOmits,
})

export const messageRoleEnumValues = ['system', 'user', 'assistant', 'tool'] as const
export const messageRoleEnum = pgEnum('role', messageRoleEnumValues)

export type MessageContent = CoreMessage['content']

export const Message = pgTable(
  'message',
  {
    id: text().primaryKey().notNull().$defaultFn(() => generateId('msg')),
    chatId: text()
      .notNull()
      .references(() => Chat.id),
    role: messageRoleEnum().notNull(),
    agentId: text().references(() => Agent.id),
    content: jsonb().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.chatId, table.role),
    index().on(table.chatId, table.agentId),
    ...timestampsIndices(table),
  ],
)

export type Message = InferSelectModel<typeof Message>

export const CreateMessageSchema = createInsertSchema(Message, {
  chatId: z.string(),
  role: z.enum(messageRoleEnumValues),
  agentId: z.string().optional(),
  content: z.record(z.unknown()),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateMessageSchema = createUpdateSchema(Message, {
  id: z.string(),
  content: z.record(z.unknown()),
}).omit({
  chatId: true,
  role: true,
  agentId: true,
  ...timestampsOmits,
})

// Message summary table to store periodic summaries of chat messages
export const MessageSummary = pgTable(
  'message_summary',
  {
    id: text().primaryKey().notNull().$defaultFn(() => generateId('msum')),
    chatId: text()
      .notNull()
      .references(() => Chat.id),
    // Summary of message history up to the message (inclusive) which has this id.
    checkpoint: text().notNull(),
    content: text().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.chatId, table.checkpoint),
    ...timestampsIndices(table),
  ],
)

export type MessageSummary = InferSelectModel<typeof MessageSummary>

export const CreateMessageSummarySchema = createInsertSchema(MessageSummary, {
  chatId: z.string(),
  checkpoint: z.number().int(),
  content: z.string(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateMessageSummarySchema = createUpdateSchema(MessageSummary, {
  id: z.string(),
  content: z.record(z.unknown()).optional(),
}).omit({
  chatId: true,
  checkpoint: true,
  ...timestampsOmits,
})

export const MessageVote = pgTable(
  'message_vote',
  {
    chatId: text()
      .notNull()
      .references(() => Chat.id),
    messageId: text()
      .notNull()
      .references(() => Message.id),
    isUpvoted: boolean().notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.messageId] }),
    ...timestampsIndices(table),
  ],
)

export type MessageVote = InferSelectModel<typeof MessageVote>

export const CreateMessageVoteSchema = createInsertSchema(MessageVote, {
  chatId: z.string(),
  messageId: z.string(),
  isUpvoted: z.boolean(),
}).omit({
  ...timestampsOmits,
})

export const UpdateMessageVoteSchema = createUpdateSchema(MessageVote, {
  chatId: z.string(),
  messageId: z.string(),
  isUpvoted: z.boolean().optional(),
}).omit({
  ...timestampsOmits,
})
