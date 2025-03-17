import { useSuspenseQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

export function useUser() {
  const trpc = useTRPC()

  const { data } = useSuspenseQuery(trpc.user.me.queryOptions())
  return data
}
