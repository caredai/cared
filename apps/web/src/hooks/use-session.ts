import { useEffect } from 'react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

import type { authClient } from '@cared/auth/client'

import { orpc } from '@/lib/orpc'

export type User = (typeof authClient.$Infer.Session)['user']
export type Session = (typeof authClient.$Infer.Session)['session']

export function useSessionPublic() {
  const {
    data,
    isSuccess,
    refetch: refetchSession,
  } = useQuery(
    orpc.user.session.queryOptions({
      input: {
        auth: false,
      },
    }),
  )
  return {
    session: data?.session,
    user: data?.user,
    isSuccess,
    refetchSession,
  }
}

export function useSession() {
  const { data, refetch: refetchSession } = useSuspenseQuery(orpc.user.session.queryOptions())
  // Since this query throws an error when the return value is null, using non-null assertion is safe here
  return {
    session: data!.session,
    user: data!.user,
    refetchSession,
  }
}

export function useCheckSession() {
  const { user, isSuccess } = useSessionPublic()

  useEffect(() => {
    if (isSuccess && !user) {
      window.location.href = '/auth/sign-in'
    }
  }, [user, isSuccess])
}

export function useAuthAccounts() {
  const {
    data: { authAccounts },
    refetch: refetchAuthAccounts,
  } = useSuspenseQuery(orpc.user.authAccounts.queryOptions())
  return {
    authAccounts,
    refetchAuthAccounts,
  }
}
