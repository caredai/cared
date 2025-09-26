import { useLogout } from '@privy-io/react-auth'
import { useRouter } from '@tanstack/react-router'

import { authClient } from '@cared/auth/client'

import { useSessionPublic } from '@/hooks/use-session'
import { useLastWorkspace } from '@/hooks/use-workspace'

export function useSignOut() {
  const router = useRouter()

  const { refetchSession } = useSessionPublic()
  const { logout } = useLogout()

  const [, setLastWorkspace] = useLastWorkspace()

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          void router.navigate({ to: '/' })
        },
      },
    })

    void refetchSession()

    try {
      await logout()
    } catch (err) {
      console.error(err)
    }
    setLastWorkspace(undefined)
  }

  return {
    signOut,
  }
}
