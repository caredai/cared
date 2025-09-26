import { createFileRoute } from '@tanstack/react-router'

import { PricingTable } from '@/components/pricing-table'

export const Route = createFileRoute('/account/pricing')({
  component: () => <PricingTable />,
})
