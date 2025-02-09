import type { InferSelectModel } from 'drizzle-orm'
import { index, json, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agent } from './agent'
import { Chat } from './chat'
import { room } from './room'
import { timestamps } from './utils'
import { user } from './workspace'

export const Memory = pgTable(
  'memory',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    content: text('content').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    agentId: uuid('agentId').references(() => agent.id),
    chatId: uuid('chatId').references(() => Chat.id),
    roomId: uuid('roomId').references(() => room.id),
    metadata: json('metadata').$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId, table.agentId),
    index().on(table.chatId),
    index().on(table.userId, table.roomId),
  ],
)

export type Memory = InferSelectModel<typeof Memory>

export const CreateMemorySchema = createInsertSchema(Memory, {
  content: z.string(),
  userId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  chatId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
