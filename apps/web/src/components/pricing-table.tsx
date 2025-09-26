import { useEffect } from 'react'

import { env } from '@/env'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}

export function PricingTable() {
  useEffect(() => {
    // Load Stripe pricing table script
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/pricing-table.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return (
    <>
      {/* @ts-ignore */}
      <stripe-pricing-table
        pricing-table-id={env.VITE_STRIPE_PRICING_TABLE_ID}
        publishable-key={env.VITE_STRIPE_PUBLISHABLE_KEY}
      />
    </>
  )
}
