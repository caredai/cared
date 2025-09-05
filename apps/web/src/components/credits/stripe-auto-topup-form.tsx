'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { Spinner } from '@/components/spinner'
import { env } from '@/env'
import {
  useCreateAutoRechargeCreditsSubscriptionCheckout,
  useCredits,
  useListCreditsOrders,
  useListCreditsSubscriptions,
} from '@/hooks/use-credits'

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

export function StripeAutoTopupForm({
  organizationId,
  autoRechargeThreshold,
  autoRechargeAmount,
  onSuccess,
  onCancel: _,
}: {
  organizationId?: string
  autoRechargeThreshold: number
  autoRechargeAmount: number
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const createAutoRechargeSubscriptionCheckout =
    useCreateAutoRechargeCreditsSubscriptionCheckout(organizationId)
  const { refetchCredits } = useCredits(organizationId)
  const { refetchCreditsOrders } = useListCreditsOrders(organizationId)
  const { refetchCreditsSubscriptions } = useListCreditsSubscriptions(organizationId)

  const [isLoading, setIsLoading] = useState(false)

  const fetchClientSecret = useCallback(async () => {
    setIsLoading(true)
    try {
      const { sessionClientSecret } = await createAutoRechargeSubscriptionCheckout(
        autoRechargeThreshold,
        autoRechargeAmount,
      )
      return sessionClientSecret
    } finally {
      setIsLoading(false)
    }
  }, [autoRechargeThreshold, autoRechargeAmount, createAutoRechargeSubscriptionCheckout])

  const onComplete = useCallback(() => {
    void refetchCredits()
    void refetchCreditsOrders()
    void refetchCreditsSubscriptions()
    onSuccess?.()
  }, [onSuccess, refetchCredits, refetchCreditsOrders, refetchCreditsSubscriptions])

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      )}
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret,
          onComplete,
        }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}

export function useCheckStripeAutoTopupCheckoutSessionReturnUrl(organizationId?: string) {
  const router = useRouter()
  const { refetchCreditsOrders } = useListCreditsOrders(organizationId)
  const { refetchCreditsSubscriptions } = useListCreditsSubscriptions(organizationId)

  useEffect(() => {
    void stripePromise.then((stripe) => {
      if (!stripe) {
        return
      }

      const sessionId = new URLSearchParams(window.location.search).get(
        'autoRechargeSubscriptionCheckoutSessionId',
      )

      if (sessionId) {
        void refetchCreditsOrders()
        void refetchCreditsSubscriptions()

        const url = new URL(window.location.toString())
        url.search = ''
        router.replace(url.toString())
      }
    })
  }, [refetchCreditsOrders, refetchCreditsSubscriptions, router])
}
