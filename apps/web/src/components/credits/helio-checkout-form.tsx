import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

import { env } from '@/env'
import { useSession } from '@/hooks/use-session'

export function HelioCheckoutForm({
  credits,
  onSuccess,
  onCancel,
}: {
  credits: number
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const { resolvedTheme } = useTheme()
  const { user } = useSession()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return
      }

      if (!event.data || typeof event.data !== 'object' || !('type' in event.data)) {
        return
      }

      const messageData = event.data as { type: string }

      switch (messageData.type) {
        case 'HELIO_CHECKOUT_REQUEST_CONFIG':
          // Send config to iframe
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'HELIO_CHECKOUT_CONFIG',
                config: {
                  paylinkId: env.VITE_HELIO_CREDITS_PAYLINK_ID,
                  amount: credits.toFixed(2),
                  customerId: user.id,
                  theme: resolvedTheme === 'light' ? 'light' : 'dark',
                },
              },
              window.location.origin,
            )
          }
          break
        case 'HELIO_CHECKOUT_SUCCESS':
          onSuccess?.()
          break
        case 'HELIO_CHECKOUT_ERROR':
        case 'HELIO_CHECKOUT_CANCEL':
          onCancel?.()
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [credits, user.id, resolvedTheme, onSuccess, onCancel])

  return (
    <iframe
      ref={iframeRef}
      src="/helio-checkout"
      className="w-full border-0"
      style={{
        minHeight: '490px',
        width: '100%',
      }}
      title="Helio Checkout"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
    />
  )
}
