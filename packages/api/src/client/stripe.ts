import { TRPCError } from '@trpc/server'
import Stripe from 'stripe'

import { env } from '../env'

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Stripe secret key is not set',
    })
  }
  if (!env.NEXT_PUBLIC_STRIPE_CREDITS_PRICE_ID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Stripe credits price ID is not set',
    })
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 1,
    timeout: 15000,
    telemetry: false,
  })
}
