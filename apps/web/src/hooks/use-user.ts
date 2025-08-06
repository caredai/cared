import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import type { AppRouter } from '@cared/api'
import type { inferRouterOutputs } from '@trpc/server'

import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type User = RouterOutput['user']['me']['user']

export function useUserMayUndefined() {
  const trpc = useTRPC()

  const { data, refetch: refetchUser } = useQuery(trpc.user.session.queryOptions())
  return {
    user: data?.user,
    refetchUser,
  }
}

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
