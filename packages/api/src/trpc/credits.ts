import assert from 'assert'
import type Stripe from 'stripe'
import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import type { OrderStatus } from '@cared/db/schema'
import { getBaseUrl } from '@cared/auth/client'
import { and, desc, eq, inArray, lt } from '@cared/db'
import { Credits, CreditsOrder, Member, orderKinds, Organization, User } from '@cared/db/schema'
import log from '@cared/log'

import type { UserContext } from '../trpc'
import { OrganizationScope } from '../auth'
import { getStripe } from '../client/stripe'
import { cfg } from '../config'
import { env } from '../env'
import { userProtectedProcedure } from '../trpc'

export async function ensureCustomer(ctx: UserContext, stripe: Stripe, organizationId?: string) {
  return await ctx.db.transaction(async (tx) => {
    let credits = (
      await tx
        .select()
        .from(Credits)
        .where(
          organizationId
            ? eq(Credits.organizationId, organizationId)
            : eq(Credits.userId, ctx.auth.userId),
        )
        .for('update')
    ) // lock
      .at(0)
    if (credits?.metadata.customerId) {
      return {
        customerId: credits.metadata.customerId,
        credits,
      }
    }

    let customer

    if (!organizationId) {
      const user = (await tx.select().from(User).where(eq(User.id, ctx.auth.userId)).for('update')) // lock
        .at(0)
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User with id ${ctx.auth.userId} not found`,
        })
      }

      customer = await stripe.customers.create({
        name: user.name,
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
    } else {
      const { organization, owner } =
        (
          await tx
            .select({
              organization: Organization,
              owner: User,
            })
            .from(Organization)
            .innerJoin(
              Member,
              and(eq(Member.organizationId, Organization.id), eq(Member.role, 'owner')),
            )
            .innerJoin(User, eq(User.id, Member.userId))
            .where(eq(Organization.id, organizationId))
            .for('update')
        ) // lock
          .at(0) ?? {}
      if (!organization || !owner) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Organization with id ${organizationId} not found`,
        })
      }

      customer = await stripe.customers.create({
        name: organization.name,
        email: owner.email,
        metadata: {
          organizationId: organization.id,
        },
      })
    }

    if (!credits) {
      credits = (
        await tx
          .insert(Credits)
          .values({
            type: organizationId ? 'organization' : 'user',
            userId: organizationId ? undefined : ctx.auth.userId,
            organizationId: organizationId,
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
    }

    return {
      customerId: customer.id,
      credits,
    }
  })
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
      !!price.unit_amount_decimal
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
  getCredits: userProtectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (input?.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions()
      }

      const stripe = getStripe()
      const { credits } = await ensureCustomer(ctx, stripe, input?.organizationId)

      return {
        credits,
      }
    }),

  listOrders: userProtectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        orderKinds: z.array(z.enum(orderKinds)).optional(),
        statuses: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions()
      }

      const conditions: SQL<unknown>[] = [
        input.organizationId
          ? eq(CreditsOrder.organizationId, input.organizationId)
          : eq(CreditsOrder.userId, ctx.auth.userId),
      ]
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
        orders: orders.map((order) => ({
          ...order,
          status: order.status as Stripe.Checkout.Session.Status | Stripe.Invoice.Status,
        })),
        hasMore,
        cursor,
      }
    }),

  cancelOrder: userProtectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions({ credits: ['delete'] })
      }

      const stripe = getStripe()

      // Find the order and verify ownership
      const order = await ctx.db.query.CreditsOrder.findFirst({
        where: and(
          eq(CreditsOrder.id, input.orderId),
          input.organizationId
            ? eq(CreditsOrder.organizationId, input.organizationId)
            : eq(CreditsOrder.userId, ctx.auth.userId),
        ),
      })
      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        })
      }

      // Check if order can be canceled based on status
      const cancelableStatuses = ['draft', 'open', 'uncollectible']
      if (
        !cancelableStatuses.includes(order.status) ||
        (order.status === 'draft' && (order.object as Stripe.Invoice).billing_reason !== 'manual')
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Order cannot be canceled in current status: ${order.status}`,
        })
      }

      let newStatus: OrderStatus
      switch (order.kind) {
        case 'stripe-payment':
        case 'stripe-subscription': {
          // Cancel checkout session
          const session = order.object as Stripe.Checkout.Session
          await stripe.checkout.sessions.expire(session.id)
          newStatus = 'expired'
          break
        }
        case 'stripe-invoice': {
          const invoice = order.object as Stripe.Invoice
          if (invoice.status === 'draft') {
            await stripe.invoices.del(invoice.id!)
            newStatus = 'deleted'
          } else {
            await stripe.invoices.voidInvoice(invoice.id!)
            newStatus = 'void'
          }
          break
        }
      }

      await ctx.db
        .update(CreditsOrder)
        .set({
          status: newStatus,
        })
        .where(eq(CreditsOrder.id, order.id))

      // If this was a recharge in progress, clear the flag
      if (order.kind === 'stripe-payment' || order.kind === 'stripe-invoice') {
        const { credits } = await ensureCustomer(ctx, stripe, input.organizationId)
        if (credits.metadata.isRechargeInProgress) {
          await ctx.db
            .update(Credits)
            .set({
              metadata: {
                ...credits.metadata,
                isRechargeInProgress: false,
              },
            })
            .where(eq(Credits.id, credits.id))
        }
      }
    }),

  createOnetimeCheckout: userProtectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        credits: z.int().min(5).max(2500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions({ credits: ['create'] })
      }

      const stripe = getStripe()

      const { customerId, credits } = await ensureCustomer(ctx, stripe, input.organizationId)

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
            quantity: Math.ceil(input.credits * 100 * (1 + cfg.platform.creditsFeeRate)),
          },
        ],
        mode: 'payment',
        return_url: returnUrl.toString(),
        // TODO: You must have a valid origin address to enable automatic tax calculation
        automatic_tax: { enabled: false },
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
            type: input.organizationId ? 'organization' : 'user',
            userId: input.organizationId ? undefined : ctx.auth.userId,
            organizationId: input.organizationId,
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

  listSubscriptions: userProtectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (input?.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions()
      }

      const stripe = getStripe()

      const { customerId } = await ensureCustomer(ctx, stripe, input?.organizationId)

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
          organizationId: z.string().optional(),
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
      if (input.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions({ credits: ['create'] })
      }

      const stripe = getStripe()

      const { customerId, credits } = await ensureCustomer(ctx, stripe, input.organizationId)

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
        // TODO: You must have a valid origin address to enable automatic tax calculation
        automatic_tax: { enabled: false },
        return_url: returnUrl.toString(),
      })

      try {
        assert.equal(typeof session.subscription, 'string')

        await ctx.db.transaction(async (tx) => {
          await tx.insert(CreditsOrder).values({
            type: input.organizationId ? 'organization' : 'user',
            userId: input.organizationId ? undefined : ctx.auth.userId,
            organizationId: input.organizationId || undefined,
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

  cancelAutoRechargeSubscription: userProtectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      if (input?.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions({ credits: ['delete'] })
      }

      const stripe = getStripe()

      const { credits } = await ensureCustomer(ctx, stripe, input?.organizationId)
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

  createAutoRechargeInvoice: userProtectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      if (input?.organizationId) {
        const scope = OrganizationScope.fromOrganization({ db: ctx.db }, input.organizationId)
        await scope.checkPermissions({ credits: ['create'] })
      }

      const stripe = getStripe()

      const { customerId, credits } = await ensureCustomer(ctx, stripe, input?.organizationId)

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
      if (Number(credits.credits) > metadata.autoRechargeThreshold!) {
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
        quantity: Math.ceil(metadata.autoRechargeAmount! * 100 * (1 + cfg.platform.creditsFeeRate)),
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
            type: input?.organizationId ? 'organization' : 'user',
            userId: input?.organizationId ? undefined : ctx.auth.userId,
            organizationId: input?.organizationId,
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
