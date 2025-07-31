import { z } from 'zod/v4'

import { getBaseUrl } from '@cared/auth/client'
import { eq } from '@cared/db'
import { CreditsBalance, CreditsOrder } from '@cared/db/schema'

import { getStripe } from '../client/stripe'
import { env } from '../env'
import { userProtectedProcedure } from '../trpc'

export const creditsRouter = {
  get: userProtectedProcedure.query(async ({ ctx }) => {
    const balance = await ctx.db.query.CreditsBalance.findFirst({
      where: eq(CreditsBalance.userId, ctx.auth.userId),
    })

    return {
      credits: balance?.credits ?? 0,
    }
  }),

  createOnetimeCheckout: userProtectedProcedure
    .input(
      z.object({
        credits: z.int().min(5).max(2500).multipleOf(0.01),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe()

      const returnUrl = new URL(`${getBaseUrl()}/account/credits`)
      returnUrl.searchParams.set('checkout_session_id', '{CHECKOUT_SESSION_ID}')

      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        line_items: [
          {
            price: env.STRIPE_CREDITS_PRICE_ID!,
            quantity: input.credits,
          },
        ],
        mode: 'payment',
        return_url: returnUrl.toString(),
        automatic_tax: { enabled: true },
      })

      try {
        await ctx.db.insert(CreditsOrder).values({
          userId: ctx.auth.userId,
          credits: input.credits,
          status: 'pending',
          kind: 'stripe-checkout',
          object: session,
        })
      } catch (err) {
        // If the order creation fails, we need to expire the checkout session.
        await stripe.checkout.sessions.expire(session.id)

        throw err
      }

      return {
        sessionClientSecret: session.client_secret,
      }
    }),
}
