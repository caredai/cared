import { redirect } from 'next/navigation'

import type { authClient } from '@cared/auth/client'

import { fetch, setData, trpc } from '@/trpc/server'

export type Session = typeof authClient.$Infer.Session

export async function prefetchAndCheckSession(
  redirectTo = '/auth/sign-in',
  check?: (session: Session) => boolean,
) {
  const session = await fetch(
    trpc.user.session.queryOptions({
      auth: false,
    }),
  )
  if (!session || (check && !check(session))) {
    redirect(redirectTo)
    return false
  }

  setData(
    trpc.user.session.queryKey({
      auth: false,
    }),
    session,
  )
  setData(trpc.user.session.queryKey(), session)

  return true
}
