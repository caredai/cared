import Script from 'next/script'

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
  return (
    <>
      <Script src="https://js.stripe.com/v3/pricing-table.js" strategy="lazyOnload" />

      {/* @ts-ignore */}
      <stripe-pricing-table
        pricing-table-id={env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID}
        publishable-key={env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      />
    </>
  )
}
