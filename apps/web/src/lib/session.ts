import { redirect } from '@tanstack/react-router'

import type { authClient } from '@cared/auth/client'

import type { QueryClient } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'

export type Session = typeof authClient.$Infer.Session

export async function prefetchAndCheckSession(
  queryClient: QueryClient,
  redirectTo = '/auth/sign-in',
  check?: (session: Session) => boolean,
) {
  const session = await queryClient.fetchQuery(
    orpc.user.session.queryOptions({
      input: {
        auth: false,
      },
    }),
  )
  if (!session || (check && !check(session))) {
    throw redirect({ to: redirectTo })
  }

  queryClient.setQueryData(
    orpc.user.session.queryKey({
      input: {
        auth: false,
      },
    }),
    session,
  )
  queryClient.setQueryData(orpc.user.session.queryKey(), session)
}
