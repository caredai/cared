'use client'

import { useEffect } from 'react'
import { HelioCheckout } from '@heliofi/checkout-react'
import { useTheme } from 'next-themes'

import { env } from '@/env'
import { useUser } from '@/hooks/use-user'

export function HelioCheckoutForm({ credits }: { credits: number }) {
  const { resolvedTheme } = useTheme()
  const { user } = useUser()

  return (
    <RemoveCssWrapper>
      <HelioCheckout
        config={{
          paylinkId: env.NEXT_PUBLIC_HELIO_CREDITS_PAYLINK_ID,
          amount: credits.toFixed(2),
          additionalJSON: {
            customerId: user.id,
          },
          primaryPaymentMethod: 'crypto',
          theme: {
            themeMode: resolvedTheme === 'light' ? 'light' : 'dark',
          },
          display: 'inline',
          showPayWithCard: true,
          // debug: true,
        }}
      />
    </RemoveCssWrapper>
  )
}

const RemoveCssWrapper = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const targetCssUrl = 'https://embed.hel.io/assets/index-v1.css'

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((n) => {
            const node = n as HTMLLinkElement
            if (node.tagName === 'LINK' && node.href === targetCssUrl) {
              console.log('Found and removed unwanted stylesheet:', node.href)
              node.remove()

              // observer.disconnect();
            }
          })
        }
      }
    })

    observer.observe(document, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return <>{children}</>
}
