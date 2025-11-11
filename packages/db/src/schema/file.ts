import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@cared/shared'

import { Account, User } from './auth-alias'
import { Chat } from './chat'

export interface FileMetadata {
  filename: string
  mimeType: string
  size: number
  url: string
}

// The file always belongs to a user and is stored under an account the user belongs to.
// Only the user himself or other users in the account with management permissions can access the file.
// When the user leaves this account, the file will be deleted.

export const File = pgTable(
  'file',
  {
    id: text()
      .notNull()
      .$defaultFn(() => generateId('file')),
    accountId: text()
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    chatId: text().references(() => Chat.id, { onDelete: 'cascade' }),
    metadata: jsonb().$type<FileMetadata>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId, table.userId),
    index().on(table.chatId),
    ...timestampsIndices(table),
  ],
)

export type File = InferSelectModel<typeof File>
