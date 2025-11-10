import { createFileRoute } from '@tanstack/react-router'

import { Credits } from '@/components/credits'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/credits')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(orpc.credits.getCredits.queryOptions())
  },
  component: CreditsPage,
})

function CreditsPage() {
  return <Credits />
}
