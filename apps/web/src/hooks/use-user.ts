import type { inferRouterOutputs } from '@trpc/server'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

import type { AppRouter } from '@cared/api'

import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type User = RouterOutput['user']['me']['user']

export function useUserPublic() {
  const trpc = useTRPC()

  const { data, refetch: refetchUser } = useQuery(trpc.user.session.queryOptions())
  return {
    user: data?.user,
    refetchUser,
  }
}

export function useUser() {
  const { user, refetchSession } = useSession()
  return {
    user,
    refetchUser: refetchSession,
  }
}

export function useSession() {
  const trpc = useTRPC()

  const { data, refetch: refetchSession } = useSuspenseQuery(
    trpc.user.session.queryOptions({
      authenticated: true,
    }),
  )
  return {
    session: data!.session,
    user: data!.user,
    refetchSession,
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
