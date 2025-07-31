import { useSuspenseQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

export function useCredits() {
  const trpc = useTRPC()

  const {
    data: { credits },
    refetch: refetchCredits,
  } = useSuspenseQuery(trpc.credits.get.queryOptions())
  return {
    credits,
    refetchCredits,
  }
}

export function useCreateCreditsOnetimeCheckout() {}
