import { useSuspenseQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

export function useUser() {
  const trpc = useTRPC()

  const {
    data: { user },
    refetch: refetchUser,
  } = useSuspenseQuery(trpc.user.me.queryOptions())
  const {
    data: { accounts },
    refetch: refetchAccounts,
  } = useSuspenseQuery(trpc.user.accounts.queryOptions())
  return {
    user,
    accounts,
    refetchUser,
    refetchAccounts,
  }
}
