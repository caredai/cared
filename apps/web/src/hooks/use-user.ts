import { useSuspenseQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

export function useUser() {
  const trpc = useTRPC()

  const {
    data: { user },
    refetch: refetchUser,
  } = useSuspenseQuery(trpc.user.me.queryOptions())
  return {
    user,
    refetchUser,
  }
}

export function useAccounts() {
  const trpc = useTRPC()

  const {
    data: { accounts },
    refetch: refetchAccounts,
  } = useSuspenseQuery(trpc.user.accounts.queryOptions())
  return {
    accounts,
    refetchAccounts,
  }
}
