import { redirect } from 'next/navigation'

import type { authClient } from '@cared/auth/client'

import { fetch, orpc, setData } from '@/orpc/client'

export type Session = typeof authClient.$Infer.Session

export async function prefetchAndCheckSession(
  redirectTo = '/auth/sign-in',
  check?: (session: Session) => boolean,
) {
  const session = await fetch(
    orpc.user.session.queryOptions({
      auth: false,
    }),
  )
  if (!session || (check && !check(session))) {
    redirect(redirectTo)
    return false
  }

  setData(
    orpc.user.session.queryKey({
      auth: false,
    }),
    session,
  )
  setData(orpc.user.session.queryKey(), session)

  return true
}
