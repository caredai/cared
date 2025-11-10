import type { InferSelectModel } from 'drizzle-orm'
import type { Stripe } from 'stripe'
import { index, jsonb, numeric, pgEnum, pgTable, text, unique } from 'drizzle-orm/pg-core'

import { Account, timestampsIndices } from '.'
import { generateId, timestamps } from './utils'

export interface CreditsMetadata {
  customerId?: string

  onetimeRechargeSessionId?: string

  autoRechargeEnabled?: boolean
  autoRechargeThreshold?: number
  autoRechargeAmount?: number

  autoRechargePaymentIntentId?: string

  subscriptionSessionId?: string
  subscriptionId?: string

  autoRechargeSessionId?: string
  autoRechargeSubscriptionId?: string
  autoRechargeInvoiceId?: string
}

export const Credits = pgTable(
  'credits',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('cdb')),
    accountId: text()
      .notNull()
      .references(() => Account.id),
    credits: numeric({ precision: 18, scale: 10 }).notNull(),
    metadata: jsonb().$type<CreditsMetadata>().notNull(),
    ...timestamps,
  },
  (table) => [
    unique().on(table.accountId),
    ...timestampsIndices(table),
  ],
)

export type Credits = InferSelectModel<typeof Credits>

export const orderKinds = [
  'stripe-payment',
  'stripe-payment-intent',
  'stripe-subscription',
  'stripe-invoice',
] as const
export type OrderKind = (typeof orderKinds)[number]
export const orderKindEnum = pgEnum('orderKind', orderKinds)

export type OrderStatus =
  | Stripe.Checkout.Session.Status
  | Stripe.PaymentIntent.Status
  | Stripe.Invoice.Status
  // for deleted invoice
  | 'deleted'

export const CreditsOrder = pgTable(
  'credits_order',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('cdo')),
    accountId: text()
      .notNull()
      .references(() => Account.id),
    kind: orderKindEnum().notNull(),
    status: text().$type<OrderStatus>().notNull(),
    objectId: text().unique().notNull(),
    object: jsonb()
      .$type<Stripe.Checkout.Session | Stripe.PaymentIntent | Stripe.Invoice>()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId, table.kind, table.status),
    index().on(table.accountId, table.status),
    ...timestampsIndices(table),
  ],
)

export type CreditsOrder = InferSelectModel<typeof CreditsOrder>

export const subscriptionKinds = ['stripe-subscription'] as const
export type SubscriptionKind = (typeof subscriptionKinds)[number]
export const subscriptionKindEnum = pgEnum('subscriptionKind', subscriptionKinds)

export type SubscriptionStatus = Stripe.Subscription.Status

export const CreditsSubscription = pgTable(
  'credits_subscription',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('cds')),
    accountId: text()
      .notNull()
      .references(() => Account.id),
    kind: subscriptionKindEnum().notNull(),
    status: text().$type<SubscriptionStatus>().notNull(),
    objectId: text().unique().notNull(),
    object: jsonb().$type<Stripe.Subscription>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId, table.kind, table.status),
    index().on(table.accountId, table.status),
    ...timestampsIndices(table),
  ],
)

export type CreditsSubscription = InferSelectModel<typeof CreditsSubscription>
