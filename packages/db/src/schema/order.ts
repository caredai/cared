import type { Stripe } from 'stripe'
import { index, integer, jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'

import { timestampsIndices, User } from '.'
import { generateId, timestamps } from './utils'

export const orderKinds = ['stripe-checkout'] as const
export type OrderKind = (typeof orderKinds)[number]
export const orderKindEnum = pgEnum('order_kind', orderKinds)

export const Order = pgTable(
  'order',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('agent')),
    userId: text()
      .notNull()
      .references(() => User.id),
    credits: integer().notNull(),
    kind: orderKindEnum().notNull(),
    object: jsonb().$type<Stripe.Checkout.Session>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId, table.kind),
    ...timestampsIndices(table),
  ],
)
