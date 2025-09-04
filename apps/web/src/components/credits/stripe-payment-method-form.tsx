'use client'

import { useState } from 'react'
import {
  AddressElement,
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { Button } from '@cared/ui/components/button'

import type { StripeElementsOptions } from '@stripe/stripe-js'
import { env } from '@/env'
import { useAddPaymentMethod, useCustomer } from '@/hooks/use-stripe'

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

interface StripePaymentMethodFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function StripePaymentMethodForm({ onSuccess, onCancel }: StripePaymentMethodFormProps) {
  const { resolvedTheme } = useTheme()

  const options: StripeElementsOptions = {
    mode: 'setup' as const,
    currency: 'usd',
    appearance: {
      theme: resolvedTheme !== 'dark' ? 'stripe' : 'night',
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentMethodForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  )
}

function PaymentMethodForm({ onSuccess, onCancel }: StripePaymentMethodFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const addPaymentMethod = useAddPaymentMethod()

  const { customer } = useCustomer()

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      // Trigger form validation and wallet collection
      const { error: submitError } = await elements.submit()
      if (submitError) {
        toast.error(`Form validation failed: ${submitError.message}`)
        return
      }

      // Create SetupIntent on the server
      const result = await addPaymentMethod()
      const clientSecret = result.clientSecret

      if (!clientSecret) {
        toast.error('Failed to create setup intent')
        return
      }

      // Confirm the SetupIntent using the Payment Element
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/account/credits`,
          payment_method_data: {
            allow_redisplay: 'always'
          }
        },
        redirect: 'if_required', // Only redirect for redirect-based payment methods
      })

      if (error) {
        toast.error(`Payment method setup failed: ${error.message ?? 'Unknown error'}`)
      } else if (setupIntent.status === 'succeeded') {
        onSuccess?.()
      }
    } catch (error) {
      console.error('Error setting up payment method:', error)
      toast.error('Failed to add payment method. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 space-y-6">
      <div className="space-y-4">
        <LinkAuthenticationElement
          options={{ defaultValues: customer?.email ? { email: customer?.email } : undefined }}
        />

        <PaymentElement options={{ layout: 'tabs' }} />

        <AddressElement
          options={{
            mode: 'billing',
            defaultValues: customer?.name ? { name: customer?.name } : undefined,
          }}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? 'Adding...' : 'Add Payment Method'}
        </Button>
      </div>
    </form>
  )
}
