import type { InferSelectModel } from 'drizzle-orm'
import type { Stripe } from 'stripe'
import { index, integer, jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'

import { timestampsIndices, User } from '.'
import { generateId, timestamps } from './utils'

export const CreditsBalance = pgTable(
  'credits_balance',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('cdb')),
    userId: text()
      .notNull()
      .references(() => User.id),
    credits: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type CreditsBalance = InferSelectModel<typeof CreditsBalance>

export const orderStatuses = ['pending', 'completed', 'failed', 'expired'] as const
export type OrderStatus = (typeof orderStatuses)[number]
export const orderStatusEnum = pgEnum('order_status', orderStatuses)

export const orderKinds = ['stripe-checkout'] as const
export type OrderKind = (typeof orderKinds)[number]
export const orderKindEnum = pgEnum('order_kind', orderKinds)

export const CreditsOrder = pgTable(
  'credits_order',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('cdo')),
    userId: text()
      .notNull()
      .references(() => User.id),
    credits: integer().notNull(),
    status: orderStatusEnum().notNull(),
    kind: orderKindEnum().notNull(),
    object: jsonb().$type<Stripe.Checkout.Session>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId, table.kind),
    ...timestampsIndices(table),
  ],
)

export type CreditsOrder = InferSelectModel<typeof CreditsOrder>

export const CreditsSubscription = pgTable(
  'credits_subscription',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('cds')),
    userId: text()
      .notNull()
      .references(() => User.id),
    credits: integer().notNull(),
    status: orderStatusEnum().notNull(),
    kind: orderKindEnum().notNull(),
    object: jsonb().$type<Stripe.Checkout.Session>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId, table.kind),
    ...timestampsIndices(table),
  ],
)

export type CreditsSubscription = InferSelectModel<typeof CreditsSubscription>
