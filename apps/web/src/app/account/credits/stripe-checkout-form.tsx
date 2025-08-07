'use client'

import { useCallback } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { env } from '@/env'
import { useCreateCreditsOnetimeCheckout } from '@/hooks/use-credits'

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

export function StripeCheckoutForm({ credits }: { credits: number }) {
  const createOnetimeCheckout = useCreateCreditsOnetimeCheckout()

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{
        fetchClientSecret: useCallback(async () => {
          const { sessionClientSecret } = await createOnetimeCheckout(credits)
          return sessionClientSecret
        }, [credits, createOnetimeCheckout]),
      }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
