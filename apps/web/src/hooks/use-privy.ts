import { useCallback } from 'react'
import { usePrivy, useSubscribeToJwtAuthWithFlag } from '@privy-io/react-auth'

import { authClient } from '@cared/auth/client'

import { useSessionPublic } from '@/hooks/use-session'

export function usePrivyJwtAuth() {
  const { user } = useSessionPublic()
  const isAuthenticated = !!user

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
