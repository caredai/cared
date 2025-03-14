'use client'

import { useEffect, useRef } from 'react'

import { useLastWorkspace } from '@/hooks/use-workspace'

export function RememberWorkspace({ id }: { id: string }) {
  const [, setLastWorkspace] = useLastWorkspace()
  const listener = useRef<any>(undefined)

  useEffect(() => {
    if (listener.current) {
      window.removeEventListener('beforeunload', listener.current)
    }
    const remember = () => setLastWorkspace(id)
    listener.current = remember
    window.addEventListener('beforeunload', remember)
  }, [id, setLastWorkspace])

  return <></>
}
