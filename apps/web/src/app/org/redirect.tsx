'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useSession } from '@/hooks/use-session'

export function Redirect() {
  const { refetchSession } = useSession()
  const router = useRouter()

  useEffect(() => {
    void refetchSession().then(() => {
      router.push('/')
    })
  }, [router, refetchSession])

  return <></>
}
