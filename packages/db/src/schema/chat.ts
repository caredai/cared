import type { InferSelectModel } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import {
  boolean,
  foreignKey,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import type { MessageContent } from '@ownxai/shared'
import { messageContentSchema, messageRoleEnumValues, uiMessageSchema } from '@ownxai/shared'

import { User } from '.'
import { Agent } from './agent'
import { App } from './app'
import {
  generateId,
  makeIdValid,
  makeObjectNonempty,
  timestamps,
  timestampsIndices,
  timestampsOmits,
  visibilityEnumValues,
} from './utils'

export { messageContentSchema }
export type { MessageContent }

export interface ChatMetadata {
  title: string
  visibility: 'public' | 'private'

  languageModel?: string
  embeddingModel?: string // used for embedding memories
  rerankModel?: string // used for reranking memories
  imageModel?: string

  [key: string]: unknown
}

const chatMetadataSchema = z
  .object({
    title: z.string(),
    visibility: z.enum(visibilityEnumValues).default('public'),
    languageModel: z.string().optional(),
    embeddingModel: z.string().optional(),
    rerankModel: z.string().optional(),
    imageModel: z.string().optional(),
  })
  .catchall(z.unknown())

export function generateChatId() {
  return generateId('chat')
}

export const Chat = pgTable(
  'chat',
  {
    id: text().primaryKey().notNull().$defaultFn(generateChatId),
    appId: text()
      .notNull()
      .references(() => App.id),
    userId: text()
      .notNull()
      .references(() => User.id),
    // Whether the chat is in debug mode.
    // Only workspace owners and members (with RBAC) can create debug chats.
    // Only one debug chat is allowed per app per user.
    debug: boolean().notNull().default(false),
    metadata: jsonb().$type<ChatMetadata>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.appId),
    index().on(table.userId, table.appId, table.debug),
  ],
)

export type Chat = InferSelectModel<typeof Chat>

export const CreateChatSchema = createInsertSchema(Chat, {
  id: makeIdValid('chat').optional(),
  appId: z.string(),
  userId: z.string(),
  debug: z.boolean().optional(),
  metadata: chatMetadataSchema,
}).omit({
  ...timestampsOmits,
})

export const UpdateChatSchema = createUpdateSchema(Chat, {
  id: z.string(),
  metadata: makeObjectNonempty(chatMetadataSchema).optional(),
}).omit({
  appId: true,
  userId: true,
  ...timestampsOmits,
})

export const messageRoleEnum = pgEnum('role', messageRoleEnumValues)

export function generateMessageId() {
  return generateId('msg')
}

export const Message = pgTable(
  'message',
  {
    id: text().primaryKey().notNull().$defaultFn(generateMessageId),
    // Parent message id. Only empty for the first message.
    parentId: text().references((): AnyPgColumn => Message.id),
    chatId: text()
      .notNull()
      .references(() => Chat.id),
    role: messageRoleEnum().notNull(),
    // Agent id. Only set for assistant role messages.
    agentId: text().references(() => Agent.id),
    content: jsonb().$type<MessageContent>().notNull(),
    metadata: jsonb(),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
    }),
    index().on(table.parentId),
    index().on(table.chatId, table.role),
    index().on(table.chatId, table.agentId),
    ...timestampsIndices(table),
  ],
)

export type Message = InferSelectModel<typeof Message>

export const CreateMessageSchema = z.object({
  id: makeIdValid('msg').optional(),
  parentId: z.string().optional(),
  chatId: z.string(),
  role: uiMessageSchema.shape.role,
  agentId: z.string().optional(),
  content: messageContentSchema,
  metadata: z.record(z.unknown()).optional(),
})

// Message summary table to store periodic summaries of chat messages
export const MessageSummary = pgTable(
  'message_summary',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('msum')),
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
