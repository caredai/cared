import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'

import { useSession } from '@/hooks/use-session'

export function Redirect() {
  const { refetchSession } = useSession()
  const router = useRouter()

  useEffect(() => {
    void refetchSession().then(() => {
      void router.navigate({ to: '/' })
    })
  }, [router, refetchSession])

  return <></>
}
