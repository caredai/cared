'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'

import type { StripeElementsOptions } from '@stripe/stripe-js'
import { SkeletonCard } from '@/components/skeleton'
import { env } from '@/env'
import { useAddPaymentMethod, useCustomer } from '@/hooks/use-stripe'
import { stripIdPrefix } from '@/lib/utils'

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

interface PaymentMethodDialogProps {
  organizationId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PaymentMethodDialog({
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: PaymentMethodDialogProps) {
  const { resolvedTheme } = useTheme()

  const options: StripeElementsOptions = {
    mode: 'setup' as const,
    currency: 'usd',
    appearance: {
      theme: resolvedTheme !== 'dark' ? 'stripe' : 'night',
    },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[95vh] px-0 flex flex-col">
        <DialogHeader className="px-6">
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>Securely add a new payment method to your account.</DialogDescription>
        </DialogHeader>
        <Elements stripe={stripePromise} options={options}>
          <PaymentMethodForm
            organizationId={organizationId}
            onSuccess={onSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  )
}

function PaymentMethodForm({
  organizationId,
  onSuccess,
  onCancel,
}: {
  organizationId?: string
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()

  const { customer } = useCustomer(organizationId)
  const addPaymentMethod = useAddPaymentMethod(organizationId)

  const [isLoading, setIsLoading] = useState(false)
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false)

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
        return
      }

      // Create SetupIntent on the server
      const result = await addPaymentMethod()
      const clientSecret = result.setupIntentClientSecret

      const segment = organizationId ? `org/${stripIdPrefix(organizationId)}` : 'account'

      // Confirm the SetupIntent
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/${segment}/credits`,
          payment_method_data: {
            allow_redisplay: 'always',
          },
        },
        redirect: 'if_required', // Only redirect for redirect-based payment methods
      })

      if (error) {
        toast.error(`Payment method setup failed: ${error.message ?? 'Unknown error'}`)
      } else if (setupIntent.status === 'succeeded') {
        toast.success('Success! Your payment method has been saved.')
        onSuccess?.()
      }
    } catch (error) {
      console.error('Failed to add payment method:', error)
      toast.error('Failed to add payment method. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 space-y-6">
      {!(isPaymentElementReady && customer) && <SkeletonCard />}
      {customer && (
        <div className="space-y-4">
          <LinkAuthenticationElement
            options={{ defaultValues: customer.email ? { email: customer.email } : undefined }}
          />

          <div style={{ display: isPaymentElementReady ? 'block' : 'none' }}>
            <PaymentElement
              options={{ layout: 'tabs' }}
              onLoaderStart={() => setIsPaymentElementReady(true)}
            />
          </div>

          <AddressElement
            options={{
              mode: 'billing',
              defaultValues: customer.name ? { name: customer.name } : undefined,
            }}
          />
        </div>
      )}

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

export function useCheckPaymentMethodSetupReturnUrl() {
  const router = useRouter()

  useEffect(() => {
    void stripePromise.then((stripe) => {
      if (!stripe) {
        return
      }

      const clientSecret = new URLSearchParams(window.location.search).get(
        'setup_intent_client_secret',
      )

      if (clientSecret) {
        void stripe.retrieveSetupIntent(clientSecret).then(({ setupIntent, error }) => {
          if (error) {
            toast.error('Failed to retrieve payment method setup intent.')
          } else {
            switch (setupIntent.status) {
              case 'succeeded':
                toast.success('Success! Your payment method has been saved.')
                break

              case 'processing':
                toast.info(
                  "Processing payment details. We'll update you when processing is complete.",
                )
                break

              case 'requires_payment_method':
                toast.error('Failed to process payment details. Please try another payment method.')
                break
            }
          }

          const url = new URL(window.location.toString())
          url.search = ''
          router.replace(url.toString())
        })
      }
    })
  }, [router])
}
