import { index, jsonb, numeric, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'

import type { GenerationDetails } from '@cared/providers'
import { createdAt, generateId } from '@cared/shared'

import { App } from './app'
import { Organization, User } from './auth-alias'

export const payerTypes = ['user', 'organization'] as const
export type PayerType = (typeof payerTypes)[number]
export const payerTypeEnum = pgEnum('payerType', payerTypes)

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
    type: payerTypeEnum().notNull(),
    userId: text()
      .references(() => User.id, { onDelete: 'cascade' })
      .notNull(), // for user type, or as an organization member for organization type
    organizationId: text().references(() => Organization.id, { onDelete: 'cascade' }), // for organization type
    appId: text().references(() => App.id, { onDelete: 'cascade' }), // when use app
    kind: expenseKindEnum().notNull(),
    cost: numeric({ precision: 18, scale: 10 }), // in credits
    details: jsonb().$type<GenerationDetails>().notNull(),
    createdAt,
  },
  (table) => [
    index().on(table.userId, table.appId),
    index().on(table.organizationId, table.userId, table.appId),
    index().on(table.createdAt),
  ],
)
