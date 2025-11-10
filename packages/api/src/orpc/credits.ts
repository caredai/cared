import type Stripe from 'stripe'
import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import type { OrderStatus } from '@cared/db/schema'
import { getWebUrl } from '@cared/auth/client'
import { and, desc, eq, inArray, lt, lte } from '@cared/db'
import { db } from '@cared/db/client'
import { Account, Credits, CreditsOrder, Member, orderKinds, User } from '@cared/db/schema'
import log from '@cared/log'

import type { Context } from '../orpc'
import { getStripe } from '../client/stripe'
import { cfg } from '../config'
import { env } from '../env'
import {
  cancelCreditsOrder,
  cancelCreditsOrdersByKind,
  createAutoRechargeInvoice,
  invalidateCreditsCache,
  triggerAutoRechargePaymentIntent,
} from '../operation'
import { protectedProcedure } from '../orpc'
import { stripIdPrefix } from '../utils'

/**
 * Ensure a Stripe customer exists for an account
 * @param ctx - Context object
 * @param stripe - Stripe instance
 * @param accountId - Account ID
 * @returns Customer ID and credits record
 */
export async function ensureCustomer(ctx: Context, stripe: Stripe, accountId: string) {
  return await db.transaction(async (tx) => {
    let credits = (
      await tx.select().from(Credits).where(eq(Credits.accountId, accountId)).for('update')
    ).at(0)

    if (credits?.metadata.customerId) {
      return {
        customerId: credits.metadata.customerId,
        credits,
      }
    }

    // Get account and owner information
    const { account, owner } =
      (
        await tx
          .select({
            account: Account,
            owner: User,
          })
          .from(Account)
          .innerJoin(Member, and(eq(Member.accountId, Account.id), eq(Member.role, 'owner')))
          .innerJoin(User, eq(User.id, Member.userId))
          .where(eq(Account.id, accountId))
          .for('update')
      ).at(0) ?? {}

    if (!account || !owner) {
      throw new ORPCError('NOT_FOUND', {
        message: `Account with id ${accountId} not found`,
      })
    }

    const customer = await stripe.customers.create({
      // TODO: update name and email upon account change
      name: account.name,
      email: owner.email,
      metadata: {
        accountId: account.id,
      },
    })

    if (!credits) {
      credits = (
        await tx
          .insert(Credits)
          .values({
            accountId,
            credits: '0',
            metadata: {
              customerId: customer.id,
            },
          })
          .returning()
      ).at(0)!
    } else {
      credits = (
        await tx
          .update(Credits)
          .set({
            metadata: {
              ...credits.metadata,
              customerId: customer.id,
            },
          })
          .where(eq(Credits.id, credits.id))
          .returning()
      ).at(0)!

      await invalidateCreditsCache(credits)
    }

    return {
      customerId: customer.id,
      credits,
    }
  })
}

async function getRechargePrice(stripe: Stripe) {
  if (!env.VITE_STRIPE_CREDITS_PRICE_ID) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Stripe top-up price ID is not configured',
    })
  }

  const price = await stripe.prices.retrieve(env.VITE_STRIPE_CREDITS_PRICE_ID, {
    expand: ['product'],
  })
  if (
    !(
      price.active &&
      price.billing_scheme === 'per_unit' &&
      price.type === 'one_time' &&
      !!price.unit_amount_decimal
    )
  ) {
    log.error(`Stripe top-up price is not configured correctly:`, price)
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Stripe top-up price is not configured correctly',
    })
  }

  return price
}

export const creditsRouter = {
  /**
   * Get credits information for the account
   * @returns Credits record
   */
  getCredits: protectedProcedure
    .route({
      method: 'GET',
      path: '/v1/credits',
      tags: ['credits'],
      summary: 'Get credits information for the account',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions()
      const accountId = context.auth.accountId

      const stripe = getStripe()
      const { credits } = await ensureCustomer(context, stripe, accountId)

      return {
        credits,
      }
    }),

  /**
   * List credits orders for the account
   * @param input - Query parameters including orderKinds, statuses, limit, and cursor
   * @returns List of orders with pagination
   */
  listOrders: protectedProcedure
    .route({
      method: 'GET',
      path: '/v1/credits/orders',
      tags: ['credits'],
      summary: 'List credits orders for the account',
    })
    .input(
      z.object({
        orderKinds: z.array(z.enum(orderKinds)).optional(),
        statuses: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions()
      const accountId = context.auth.accountId

      const conditions: SQL<unknown>[] = [eq(CreditsOrder.accountId, accountId)]
      if (input.orderKinds) {
        conditions.push(inArray(CreditsOrder.kind, input.orderKinds))
      }
      if (input.statuses) {
        conditions.push(inArray(CreditsOrder.status, input.statuses as OrderStatus[]))
      }
      if (input.cursor) {
        conditions.push(lt(CreditsOrder.id, input.cursor))
      }
      const query = and(...conditions)

      while (true) {
        const orders = await db
          .select()
          .from(CreditsOrder)
          .where(query)
          .orderBy(desc(CreditsOrder.id))
          .limit(input.limit + 1)

        const hasMore = orders.length > input.limit
        if (hasMore) {
          orders.pop()
        }
        const cursor = orders.at(-1)?.id

        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        if (
          orders.find(
            (order) =>
              ['expired', 'void', 'deleted'].includes(order.status) &&
              order.updatedAt <= oneWeekAgo,
          )
        ) {
          await db
            .delete(CreditsOrder)
            .where(
              and(
                eq(CreditsOrder.accountId, accountId),
                inArray(CreditsOrder.status, ['expired', 'void', 'deleted']),
                lte(CreditsOrder.updatedAt, oneWeekAgo),
              ),
            )

          continue
        }

        return {
          orders: orders.map((order) => ({
            ...order,
            status: order.status as Stripe.Checkout.Session.Status | Stripe.Invoice.Status,
          })),
          hasMore,
          cursor,
        }
      }
    }),

  /**
   * Cancel a credits order
   * @param input - Order ID
   * @returns Success status
   */
  cancelOrder: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/v1/credits/orders/{orderId}',
      tags: ['credits'],
      summary: 'Cancel a credits order',
    })
    .input(
      z.object({
        orderId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      await cancelCreditsOrder(input.orderId, accountId, true)
    }),

  /**
   * Create a one-time checkout session for credits purchase
   * @param input - Credits amount
   * @returns Checkout session client secret and ID
   */
  createOnetimeCheckout: protectedProcedure
    .route({
      method: 'POST',
      path: '/v1/credits/checkout',
      tags: ['credits'],
      summary: 'Create a one-time checkout session for credits purchase',
    })
    .input(
      z.object({
        credits: z.int().min(5).max(2500),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      const stripe = getStripe()

      // Cancel any existing onetime recharge orders before creating a new one
      const cancelled = await cancelCreditsOrdersByKind('stripe-payment', accountId, false)
      if (cancelled === false) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Cannot cancel existing onetime recharge order',
        })
      }

      const { customerId, credits } = await ensureCustomer(context, stripe, accountId)

      const returnUrl =
        getCreditsBaseUrl(accountId) + `?onetimeCheckoutSessionId={CHECKOUT_SESSION_ID}`

      const price = await getRechargePrice(stripe)

      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        line_items: [
          {
            price: price.id,
            quantity: Math.ceil(
              input.credits * 100 + Math.max(input.credits * 100 * cfg.platform.creditsFeeRate, 80),
            ),
          },
        ],
        mode: 'payment',
        return_url: returnUrl,
        // TODO: You must have a valid origin address to enable automatic tax calculation
        automatic_tax: { enabled: false },
        customer: customerId,
        payment_intent_data: {
          setup_future_usage: 'off_session',
        },
        payment_method_data: {
          allow_redisplay: 'always',
        },
        saved_payment_method_options: {
          // payment_method_save: 'enabled',
        },
        metadata: {
          credits: input.credits.toString(),
        },
      })

      try {
        await db.transaction(async (tx) => {
          await tx.insert(CreditsOrder).values({
            accountId,
            kind: 'stripe-payment',
            status: session.status!,
            objectId: session.id,
            object: session,
          })

          // Get credits with select for update to ensure proper locking
          const lockedCredits = (
            await tx.select().from(Credits).where(eq(Credits.id, credits.id)).for('update')
          ).at(0)!
          if (lockedCredits.metadata.onetimeRechargeSessionId) {
            throw new ORPCError('BAD_REQUEST', {
              message: 'Onetime recharge session already exists',
            })
          }

          await tx
            .update(Credits)
            .set({
              metadata: {
                ...credits.metadata,
                onetimeRechargeSessionId: session.id,
              },
            })
            .where(eq(Credits.id, credits.id))

          await invalidateCreditsCache(credits)
        })
      } catch (err) {
        // If the order creation fails, we need to expire the checkout session.
        await stripe.checkout.sessions.expire(session.id)

        throw err
      }

      return {
        sessionClientSecret: session.client_secret!,
        sessionId: session.id,
      }
    }),

  /**
   * List Stripe subscriptions for the account
   * @returns List of subscriptions
   */
  listSubscriptions: protectedProcedure
    .route({
      method: 'GET',
      path: '/v1/credits/subscriptions',
      tags: ['credits'],
      summary: 'List Stripe subscriptions for the account',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions()
      const accountId = context.auth.accountId

      const stripe = getStripe()

      const { customerId } = await ensureCustomer(context, stripe, accountId)

      const result = await stripe.subscriptions.list({
        customer: customerId,
        // NOTE: There should not be many non-canceled subscriptions, so we can safely use a high limit and avoid pagination.
        limit: 100,
      })

      return {
        subscriptions: result.data,
      }
    }),

  /**
   * Create an auto-recharge invoice for credits
   * @returns Success status
   */
  createAutoRechargeInvoice: protectedProcedure
    .route({
      method: 'POST',
      path: '/v1/credits/auto-recharge/invoice',
      tags: ['credits'],
      summary: 'Create an auto-recharge invoice for credits',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      await createAutoRechargeInvoice(accountId, true)
    }),

  /**
   * Create an auto-recharge payment intent for credits
   * @returns Success status
   */
  createAutoRechargePayment: protectedProcedure
    .route({
      method: 'POST',
      path: '/v1/credits/auto-recharge/payment',
      tags: ['credits'],
      summary: 'Create an auto-recharge payment intent for credits',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      const credits = await db.query.Credits.findFirst({
        where: eq(Credits.accountId, accountId),
      })
      if (!credits) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Credits record not found',
        })
      }

      await triggerAutoRechargePaymentIntent(credits, true)
    }),

  /**
   * Update auto-recharge settings for credits
   * @param input - Settings including enabled flag, threshold, and amount
   * @returns Success status
   */
  updateAutoRechargeSettings: protectedProcedure
    .route({
      method: 'PUT',
      path: '/v1/credits/auto-recharge/settings',
      tags: ['credits'],
      summary: 'Update auto-recharge settings for credits',
    })
    .input(
      z
        .object({
          enabled: z.boolean().optional(),
          threshold: z.int().min(5).max(2500).optional(),
          amount: z.int().min(5).max(2500).optional(),
        })
        .refine(
          (data) => {
            // If enabled, threshold and amount must be provided
            if (data.enabled) {
              return data.amount && data.threshold && data.amount >= data.threshold
            }
            return true
          },
          {
            message:
              'Auto-recharge amount must be greater than or equal to the threshold when enabled',
          },
        ),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ credits: ['write'] })
      const accountId = context.auth.accountId

      const { credits } = await ensureCustomer(context, getStripe(), accountId)

      await db.transaction(async (tx) => {
        // Get credits with select for update to ensure proper locking
        const _lockedCredits = (
          await tx.select().from(Credits).where(eq(Credits.id, credits.id)).for('update')
        ).at(0)!

        // Build update data
        const updateData = {
          ...credits.metadata,
        }

        if (!input.enabled) {
          updateData.autoRechargeEnabled = false
          updateData.autoRechargeThreshold = undefined
          updateData.autoRechargeAmount = undefined
        } else {
          updateData.autoRechargeEnabled = true
          updateData.autoRechargeThreshold = input.threshold
          updateData.autoRechargeAmount = input.amount
        }

        await tx.update(Credits).set({ metadata: updateData }).where(eq(Credits.id, credits.id))

        await invalidateCreditsCache(credits)
      })
    }),
}

/**
 * Get the base URL for credits page
 * @param accountId - Account ID
 * @returns Credits page URL
 */
export function getCreditsBaseUrl(accountId: string) {
  return `${getWebUrl()}/${stripIdPrefix(accountId)}/credits`
}
