import type { InferSelectModel } from 'drizzle-orm'
import type { CoreMessage } from 'ai'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  uuid,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { Agent } from './agent'
import { App } from './app'
import { timestamps, timestampsIndices, timestampsOmits, visibilityEnumValues } from './utils'
import { User } from './workspace'

export const chatTypeEnumValues = ['chat', 'room'] as const
export const chatTypeEnum = pgEnum('chatType', chatTypeEnumValues)

export interface ChatMetadata {
  title: string
  visibility: (typeof visibilityEnumValues)[number]

  languageModel: string
  embeddingModel: string

  [key: string]: unknown
}

const chatMetadataZod = z
  .object({
    title: z.string(),
    visibility: z.enum(visibilityEnumValues),
    languageModel: z.string(),
    embeddingModel: z.string(),
  })
  .catchall(z.unknown())

export const Chat = pgTable(
  'chat',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    appId: uuid()
      .notNull()
      .references(() => App.id),
    // The user who created/owns the chat/room
    owner: uuid()
      .notNull()
      .references(() => User.id),
    type: chatTypeEnum().notNull().default('chat'),
    metadata: jsonb().$type<ChatMetadata>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.appId),
    index().on(table.owner),
  ],
)

export type Chat = InferSelectModel<typeof Chat>

export const CreateChatSchema = createInsertSchema(Chat, {
  appId: z.string().uuid(),
  owner: z.string().uuid(),
  type: z.enum(chatTypeEnumValues),
  metadata: chatMetadataZod,
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateChatSchema = createUpdateSchema(Chat, {
  id: z.string(),
  owner: z.string().uuid().optional(),
  metadata: chatMetadataZod.optional(),
}).omit({
  appId: true,
  type: true,
  ...timestampsOmits,
})

export const ChatUser = pgTable(
  'chat_user',
  {
    chatId: uuid()
      .notNull()
      .references(() => Chat.id),
    userId: uuid()
      .notNull()
      .references(() => User.id),
    // Whether the user is still active in the chat/room
    isActive: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.userId] }),
    index().on(table.chatId, table.isActive),
    ...timestampsIndices(table),
  ],
)

export type ChatUser = InferSelectModel<typeof ChatUser>

export const CreateChatUserSchema = createInsertSchema(ChatUser, {
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
  isActive: z.boolean().optional(),
}).omit({
  ...timestampsOmits,
})

export const UpdateChatUserSchema = createUpdateSchema(ChatUser, {
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
  isActive: z.boolean().optional(),
}).omit({
  ...timestampsOmits,
})

export const messageRoleEnumValues = ['user', 'assistant', 'system', 'data'] as const
export const messageRoleEnum = pgEnum('role', messageRoleEnumValues)

export type MessageContent = CoreMessage['content']

export const Message = pgTable(
  'message',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    chatId: uuid()
      .notNull()
      .references(() => Chat.id),
    index: integer().notNull(),
    role: messageRoleEnum().notNull(),
    agentId: uuid().references(() => Agent.id),
    userId: uuid().references(() => User.id),
    content: jsonb().$type<MessageContent>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.chatId, table.index),
    index().on(table.chatId, table.role),
    index().on(table.chatId, table.agentId),
    index().on(table.chatId, table.userId),
    ...timestampsIndices(table),
  ],
)

export type Message = InferSelectModel<typeof Message>

export const CreateMessageSchema = createInsertSchema(Message, {
  chatId: z.string().uuid(),
  index: z.number().int(),
  // @ts-ignore
  role: z.enum(messageRoleEnumValues),
  agentId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  content: z.record(z.unknown()),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateMessageSchema = createUpdateSchema(Message, {
  id: z.string(),
  content: z.any().optional(),
}).omit({
  chatId: true,
  index: true,
  role: true,
  agentId: true,
  userId: true,
  ...timestampsOmits,
})

export const MessageVote = pgTable(
  'message_vote',
  {
    chatId: uuid()
      .notNull()
      .references(() => Chat.id),
    messageId: uuid()
      .notNull()
      .references(() => Message.id),
    userId: uuid()
      .notNull()
      .references(() => User.id),
    isUpvoted: boolean().notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.messageId, table.userId] }),
    ...timestampsIndices(table),
  ],
)

export type MessageVote = InferSelectModel<typeof MessageVote>

export const CreateMessageVoteSchema = createInsertSchema(MessageVote, {
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  userId: z.string().uuid(),
  isUpvoted: z.boolean(),
}).omit({
  ...timestampsOmits,
})

export const UpdateMessageVoteSchema = createUpdateSchema(MessageVote, {
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  userId: z.string().uuid(),
  isUpvoted: z.boolean().optional(),
}).omit({
  ...timestampsOmits,
})
