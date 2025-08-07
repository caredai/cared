import assert from 'assert'
import type Stripe from 'stripe'
import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import type { OrderStatus } from '@cared/db/schema'
import { getBaseUrl } from '@cared/auth/client'
import { and, desc, eq, inArray, lt } from '@cared/db'
import { Credits, CreditsOrder, orderKinds, User } from '@cared/db/schema'
import log from '@cared/log'

import type { Context } from '../trpc'
import { getStripe } from '../client/stripe'
import { env } from '../env'
import { userProtectedProcedure } from '../trpc'

export const creditsFeeRate = 0.05

async function ensureCustomer(ctx: Context, stripe: Stripe) {
  let credits = await ctx.db.query.Credits.findFirst({
    where: eq(Credits.userId, ctx.auth.userId!),
  })
  if (credits?.metadata.customerId) {
    return {
      customerId: credits.metadata.customerId,
      credits,
    }
  }

  const user = await ctx.db.query.User.findFirst({
    where: eq(User.id, ctx.auth.userId!),
  })
  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `User with id ${ctx.auth.userId} not found`,
    })
  }

  const customer = await stripe.customers.create({
    name: user.name,
    email: user.email,
    metadata: {
      userId: user.id,
    },
  })

  credits = (
    await ctx.db
      .insert(Credits)
      .values({
        userId: ctx.auth.userId!,
        credits: 0,
        metadata: {
          customerId: customer.id,
        },
      })
      .returning()
  )[0]!

  return {
    customerId: customer.id,
    credits,
  }
}

async function getRechargePrice(stripe: Stripe) {
  if (!env.NEXT_PUBLIC_STRIPE_CREDITS_PRICE_ID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Stripe top-up price ID is not configured',
    })
  }

  const price = await stripe.prices.retrieve(env.NEXT_PUBLIC_STRIPE_CREDITS_PRICE_ID, {
    expand: ['product'],
  })
  if (
    !(
      price.active &&
      price.billing_scheme === 'per_unit' &&
      price.type === 'one_time' &&
      !!price.unit_amount
    )
  ) {
    log.error(`Stripe top-up price is not configured correctly:`, price)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Stripe top-up price is not configured correctly',
    })
  }

  return price
}

async function getAutoRechargePrice(stripe: Stripe) {
  if (!env.NEXT_PUBLIC_STRIPE_CREDITS_AUTO_TOPUP_PRICE_ID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Stripe auto top-up price ID is not configured',
    })
  }

  const price = await stripe.prices.retrieve(env.NEXT_PUBLIC_STRIPE_CREDITS_AUTO_TOPUP_PRICE_ID, {
    expand: ['product'],
  })
  if (
    !(
      price.active &&
      price.billing_scheme === 'per_unit' &&
      price.recurring?.usage_type === 'metered' &&
      price.type === 'recurring' &&
      price.unit_amount === 0
    )
  ) {
    log.error(`Stripe auto top-up price is not configured correctly:`, price)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Stripe auto top-up price is not configured correctly',
    })
  }

  return price
}

export const creditsRouter = {
  getCredits: userProtectedProcedure.query(async ({ ctx }) => {
    const stripe = getStripe()
    const { credits } = await ensureCustomer(ctx, stripe)

    return {
      credits,
    }
  }),

  listOrders: userProtectedProcedure
    .input(
      z.object({
        orderKinds: z.array(z.enum(orderKinds)).optional(),
        statuses: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL<unknown>[] = [eq(CreditsOrder.userId, ctx.auth.userId)]
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

      const orders = await ctx.db
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

      return {
        orders,
        hasMore,
        cursor,
      }
    }),

  createOnetimeCheckout: userProtectedProcedure
    .input(
      z.object({
        credits: z.int().min(5).max(2500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe()

      const { customerId, credits } = await ensureCustomer(ctx, stripe)

      if (credits.metadata.isRechargeInProgress) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Recharge is already in progress',
        })
      }

      const returnUrl = new URL(`${getBaseUrl()}/account/credits`)
      returnUrl.searchParams.set('checkout_session_id', '{CHECKOUT_SESSION_ID}')

      const price = await getRechargePrice(stripe)

      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        line_items: [
          {
            price: price.id,
            quantity: Math.ceil(input.credits * 100 * (1 + creditsFeeRate)),
          },
        ],
        mode: 'payment',
        return_url: returnUrl.toString(),
        automatic_tax: { enabled: true },
        customer: customerId,
        payment_intent_data: {
          setup_future_usage: 'off_session',
        },
        saved_payment_method_options: {
          payment_method_save: 'enabled',
        },
        metadata: {
          credits: input.credits.toString(),
        },
      })

      try {
        await ctx.db.transaction(async (tx) => {
          await tx.insert(CreditsOrder).values({
            userId: ctx.auth.userId,
            kind: 'stripe-payment',
            status: session.status!,
            objectId: session.id,
            object: session,
          })

          await tx
            .update(Credits)
            .set({
              metadata: {
                ...credits.metadata,
                isRechargeInProgress: true,
              },
            })
            .where(eq(Credits.id, credits.id))
        })
      } catch (err) {
        // If the order creation fails, we need to expire the checkout session.
        await stripe.checkout.sessions.expire(session.id)

        throw err
      }

      return {
        sessionClientSecret: session.client_secret!,
      }
    }),

  listSubscriptions: userProtectedProcedure.query(async ({ ctx }) => {
    const stripe = getStripe()

    const { customerId } = await ensureCustomer(ctx, stripe)

    const result = await stripe.subscriptions.list({
      customer: customerId,
      // NOTE: There should not be many non-canceled subscriptions, so we can safely use a high limit and avoid pagination.
      limit: 100,
    })

    return {
      subscriptions: result.data,
    }
  }),

  createAutoRechargeSubscriptionCheckout: userProtectedProcedure
    .input(
      z
        .object({
          autoRechargeThreshold: z.int().min(5),
          autoRechargeAmount: z.int().min(5),
        })
        .refine(
          (data) => {
            return data.autoRechargeAmount >= data.autoRechargeThreshold
          },
          {
            message: 'Auto-recharge amount must be greater than or equal to the threshold',
          },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe()

      const { customerId, credits } = await ensureCustomer(ctx, stripe)

      if (credits.metadata.autoRechargeSubscriptionId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Auto-recharge subscription already exists',
        })
      }

      const price = await getAutoRechargePrice(stripe)

      const returnUrl = new URL(`${getBaseUrl()}/account/credits`)
      returnUrl.searchParams.set('checkout_session_id', '{CHECKOUT_SESSION_ID}')

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        ui_mode: 'embedded',
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        customer: customerId,
        subscription_data: {
          // Suppress zero-amount line items when adding usage-based items.
          // https://docs.stripe.com/billing/subscriptions/billing-mode#usage-based-pricing
          billing_mode: {
            type: 'flexible',
          },
        },
        payment_intent_data: {
          setup_future_usage: 'off_session',
        },
        saved_payment_method_options: {
          payment_method_save: 'enabled',
        },
        automatic_tax: { enabled: true },
        return_url: returnUrl.toString(),
      })

      try {
        assert.equal(typeof session.subscription, 'string')

        await ctx.db.transaction(async (tx) => {
          await tx.insert(CreditsOrder).values({
            userId: ctx.auth.userId,
            kind: 'stripe-subscription',
            status: session.status!,
            objectId: session.id,
            object: session,
          })

          await tx
            .update(Credits)
            .set({
              metadata: {
                ...credits.metadata,
                autoRechargeSubscriptionId: session.subscription as string,
                autoRechargeThreshold: input.autoRechargeThreshold,
                autoRechargeAmount: input.autoRechargeAmount,
              },
            })
            .where(eq(Credits.id, credits.id))
        })
      } catch (err) {
        // If the order creation fails, we need to expire the checkout session.
        await stripe.checkout.sessions.expire(session.id)

        throw err
      }

      return {
        sessionClientSecret: session.client_secret!,
      }
    }),

  cancelAutoRechargeSubscription: userProtectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe()

    const { credits } = await ensureCustomer(ctx, stripe)
    if (!credits.metadata.autoRechargeSubscriptionId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Auto-recharge subscription does not exist',
      })
    }

    const subscription = await stripe.subscriptions.retrieve(
      credits.metadata.autoRechargeSubscriptionId,
    )
    console.log(
      `Canceling auto-recharge subscription ${credits.metadata.autoRechargeSubscriptionId} with status ${subscription.status}`,
    )

    if (subscription.status !== 'canceled') {
      await stripe.subscriptions.cancel(credits.metadata.autoRechargeSubscriptionId)
    }

    await ctx.db
      .update(Credits)
      .set({
        metadata: {
          ...credits.metadata,
          autoRechargeSubscriptionId: undefined,
        },
      })
      .where(eq(Credits.id, credits.id))
  }),

  createAutoRechargeInvoice: userProtectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe()

    const { customerId, credits } = await ensureCustomer(ctx, stripe)

    const metadata = credits.metadata
    if (metadata.isRechargeInProgress) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Recharge is already in progress',
      })
    }
    if (!metadata.autoRechargeSubscriptionId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Auto-recharge subscription does not exist',
      })
    }
    if (credits.credits > metadata.autoRechargeThreshold!) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `You have enough credits (${credits.credits}), no need to recharge`,
      })
    }

    const price = await getRechargePrice(stripe)

    await stripe.invoiceItems.create({
      customer: customerId,
      pricing: {
        price: price.id,
      },
      quantity: Math.ceil(metadata.autoRechargeAmount! * 100 * (1 + creditsFeeRate)),
      subscription: credits.metadata.autoRechargeSubscriptionId,
    })

    const { lastResponse: _, ...invoice } = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      auto_advance: true,
      metadata: {
        credits: metadata.autoRechargeAmount!.toString(),
      },
    })

    try {
      await ctx.db.transaction(async (tx) => {
        await tx.insert(CreditsOrder).values({
          userId: ctx.auth.userId,
          kind: 'stripe-invoice',
          status: invoice.status!,
          objectId: invoice.id!,
          object: invoice,
        })

        await tx
          .update(Credits)
          .set({
            metadata: {
              ...credits.metadata,
              isRechargeInProgress: true,
            },
          })
          .where(eq(Credits.id, credits.id))
      })
    } catch (err) {
      // If the order creation fails, we need to void the invoice.
      await stripe.invoices.voidInvoice(invoice.id!)

      throw err
    }
  }),
}
