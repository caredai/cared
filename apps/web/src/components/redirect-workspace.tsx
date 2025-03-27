'use client'

import { useEffect } from 'react'

import { useRedirectWorkspace } from '@/hooks/use-workspace'

export function RedirectWorkspace() {
  const redirect = useRedirectWorkspace()

  useEffect(() => {
    redirect()
  }, [redirect])

  return <></>
}
