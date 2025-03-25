'use client'

import { useEffect } from 'react'

import { useLastWorkspace } from '@/hooks/use-workspace'

export function RememberWorkspace({ id }: { id: string }) {
  const [, setLastWorkspace] = useLastWorkspace()

  useEffect(() => {
    const remember = () => setLastWorkspace(id)
    window.addEventListener('beforeunload', remember)
    return () => window.removeEventListener('beforeunload', remember)
  }, [id, setLastWorkspace])

  return <></>
}
