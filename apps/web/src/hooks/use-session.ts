import { useCallback } from 'react'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'

import { authClient } from '@cared/auth/client'

import { useTRPC } from '@/trpc/client'

export type User = (typeof authClient.$Infer.Session)['user']
export type Session = (typeof authClient.$Infer.Session)['session']

function useRefetchSession() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useCallback(async () => {
    const session = (
      await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      })
    ).data

    queryClient.setQueryData(trpc.user.session.queryKey(), session)
    queryClient.setQueryData(
      trpc.user.session.queryKey({
        auth: false,
      }),
      session,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useSessionPublic() {
  const trpc = useTRPC()

  const refetchSession = useRefetchSession()

  const { data } = useQuery(
    trpc.user.session.queryOptions({
      auth: false,
    }),
  )
  return {
    session: data?.session,
    user: data?.user,
    refetchSession,
  }
}

export function useSession() {
  const trpc = useTRPC()

  const refetchSession = useRefetchSession()

  const { data } = useSuspenseQuery(trpc.user.session.queryOptions())
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
