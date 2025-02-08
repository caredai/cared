import type { InferSelectModel } from 'drizzle-orm'
import { index, json, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agent } from './agent'
import { chat } from './chat'
import { room } from './room'
import { timestamps } from './utils'
import { user } from './workspace'

export const memory = pgTable(
  'memory',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    content: text('content').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    agentId: uuid('agentId').references(() => agent.id),
    chatId: uuid('chatId').references(() => chat.id),
    roomId: uuid('roomId').references(() => room.id),
    metadata: json('metadata').$type<Record<string, unknown>>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId, table.agentId),
    index().on(table.chatId),
    index().on(table.userId, table.roomId),
  ],
)

export type Memory = InferSelectModel<typeof memory>

export const CreateMemorySchema = createInsertSchema(memory, {
  content: z.string(),
  userId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  chatId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
