import { useEffect, useState } from 'react'
import { HelioCheckout } from '@heliofi/checkout-react'
import { createFileRoute } from '@tanstack/react-router'

import { env } from '@/env'

export const Route = createFileRoute('/helio-checkout')({
  component: HelioCheckoutPage,
})

function HelioCheckoutPage() {
  const [config, setConfig] = useState<{
    paylinkId?: string
    amount: string
    customerId: string
    theme: 'light' | 'dark'
  } | null>(null)

  // Listen for messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security (adjust based on your domain)
      if (
        event.data &&
        typeof event.data === 'object' &&
        'type' in event.data &&
        (event.data as { type: string }).type === 'HELIO_CHECKOUT_CONFIG' &&
        'config' in event.data &&
        typeof (event.data as { config: unknown }).config === 'object'
      ) {
        const messageData = event.data as {
          type: string
          config: {
            paylinkId?: string
            amount: string
            customerId: string
            theme: 'light' | 'dark'
          }
        }
        setConfig({
          paylinkId: messageData.config.paylinkId ?? '',
          amount: messageData.config.amount,
          customerId: messageData.config.customerId,
          theme: messageData.config.theme,
        })
      }
    }

    window.addEventListener('message', handleMessage)

    // Request config from parent
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'HELIO_CHECKOUT_REQUEST_CONFIG' }, '*')
    }

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Send callbacks to parent window
  const handleSuccess = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'HELIO_CHECKOUT_SUCCESS' }, '*')
    }
  }

  const handleError = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'HELIO_CHECKOUT_ERROR' }, '*')
    }
  }

  const handleCancel = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'HELIO_CHECKOUT_CANCEL' }, '*')
    }
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <HelioCheckout
      config={{
        paylinkId: config.paylinkId ?? env.VITE_HELIO_CREDITS_PAYLINK_ID ?? '',
        amount: config.amount,
        additionalJSON: {
          customerId: config.customerId,
        },
        primaryPaymentMethod: 'crypto',
        stretchFullWidth: true,
        theme: {
          themeMode: config.theme,
        },
        display: 'inline',
        showPayWithCard: true,
        onSuccess: handleSuccess,
        onError: handleError,
        onCancel: handleCancel,
      }}
    />
  )
}
