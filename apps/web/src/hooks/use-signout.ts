import { useRouter } from 'next/navigation'
import { useLogout } from '@privy-io/react-auth'

import { authClient } from '@cared/auth/client'

import { useUserPublic } from '@/hooks/use-user'
import { useLastWorkspace } from '@/hooks/use-workspace'

export function useSignOut() {
  const router = useRouter()

  const { refetchUser } = useUserPublic()
  const { logout } = useLogout()

  const [, setLastWorkspace] = useLastWorkspace()

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/')
        },
      },
    })

    void refetchUser()

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
