import type { InferSelectModel } from 'drizzle-orm'
import type { Stripe } from 'stripe'
import { index, integer, jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'

import { timestampsIndices, User } from '.'
import { generateId, timestamps } from './utils'

export interface CreditsMetadata {
  customerId?: string
  isRechargeInProgress?: boolean
  autoRechargeSubscriptionId?: string
  autoRechargeThreshold?: number
  autoRechargeAmount?: number
}

export const Credits = pgTable(
  'credits',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('cdb')),
    userId: text()
      .notNull()
      .references(() => User.id),
    credits: integer().notNull(),
    metadata: jsonb().$type<CreditsMetadata>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type Credits = InferSelectModel<typeof Credits>

export const orderKinds = ['stripe-payment', 'stripe-subscription', 'stripe-invoice'] as const
export type OrderKind = (typeof orderKinds)[number]
export const orderKindEnum = pgEnum('order_kind', orderKinds)

export type OrderStatus = Stripe.Checkout.Session.Status | Stripe.Invoice.Status

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
    kind: orderKindEnum().notNull(),
    status: text().$type<OrderStatus>().notNull(),
    objectId: text().unique().notNull(),
    object: jsonb().$type<Stripe.Checkout.Session | Stripe.Invoice>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId, table.kind, table.status),
    index().on(table.userId, table.status),
    ...timestampsIndices(table),
  ],
)

export type CreditsOrder = InferSelectModel<typeof CreditsOrder>

export const subscriptionKinds = ['stripe-subscription'] as const
export type SubscriptionKind = (typeof subscriptionKinds)[number]
export const subscriptionKindEnum = pgEnum('subscription_kind', subscriptionKinds)

export type SubscriptionStatus = Stripe.Subscription.Status

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
    kind: subscriptionKindEnum().notNull(),
    status: text().$type<SubscriptionStatus>().notNull(),
    objectId: text().unique().notNull(),
    object: jsonb().$type<Stripe.Subscription>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId, table.kind, table.status),
    index().on(table.userId, table.status),
    ...timestampsIndices(table),
  ],
)

export type CreditsSubscription = InferSelectModel<typeof CreditsSubscription>
