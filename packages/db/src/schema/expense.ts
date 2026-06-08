import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, numeric, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'

import type { GenerationDetails } from '@cared/providers'
import { createdAt, generateId } from '@cared/shared'

import { OAuthApp } from './oauth-app'
import { Account, User } from './auth-alias'

export const expenseKinds = ['generation'] as const
export type ExpenseKind = (typeof expenseKinds)[number]
export const expenseKindEnum = pgEnum('expenseKind', expenseKinds)

export const Expense = pgTable(
  'expense',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('gen')),
    accountId: text()
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    userId: text().references(() => User.id, { onDelete: 'cascade' }), // spender
    oauthAppId: text().references(() => OAuthApp.id, { onDelete: 'set null' }),
    kind: expenseKindEnum().notNull(),
    cost: numeric({ precision: 18, scale: 10 }), // in credits
    details: jsonb().$type<GenerationDetails>().notNull(),
    createdAt,
  },
  (table) => [
    index().on(table.accountId, table.userId, table.oauthAppId),
    index().on(table.accountId, table.oauthAppId),
    index().on(table.userId, table.oauthAppId),
    index().on(table.createdAt),
  ],
)

export type Expense = InferSelectModel<typeof Expense>
