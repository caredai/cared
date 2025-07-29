import { z } from 'zod/v4'

import { getBaseUrl } from '@cared/auth/client'

import { getStripe } from '../client/stripe'
import { appOrUserProtectedProcedure } from '../trpc'

export const paymentRouter = {
  createRechargeCheckout: appOrUserProtectedProcedure
    .input(
      z.object({
        credits: z.int().min(5).max(2500).multipleOf(0.01),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe()

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'hkd', // TODO: usd
              product_data: {
                name: 'CARED Credits',
              },
              unit_amount: input.credits * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${getBaseUrl()}/recharge/success`,
        cancel_url: `${getBaseUrl()}/recharge/cancel`,
      })

      return {
        checkoutUrl: session.url,
      }
    }),
}
