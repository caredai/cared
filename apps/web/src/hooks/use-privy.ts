import { useCallback } from 'react'
import { usePrivy, useSubscribeToJwtAuthWithFlag } from '@privy-io/react-auth'
import { useQuery } from '@tanstack/react-query'

import { authClient } from '@cared/auth/client'

import { useTRPC } from '@/trpc/client'

export function usePrivyJwtAuth() {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.user.session.queryOptions())
  const isAuthenticated = !!data?.session

  const { ready, authenticated } = usePrivy()

  useSubscribeToJwtAuthWithFlag({
    enabled: !(ready && authenticated),
    isAuthenticated,
    getExternalJwt: useCallback(async () => {
      if (!isAuthenticated) {
        return
      }
      try {
        const result = await authClient.token()
        return result.data?.token
      } catch (err) {
        console.error(err)
      }
    }, [isAuthenticated]),
    onAuthenticated: (event) => console.log('Privy onAuthenticated', event),
    onUnauthenticated: () => console.log('Privy onUnauthenticated'),
  })
}
