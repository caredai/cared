'use client'

import { useEffect, useRef } from 'react'

import { useContentAreaRef } from '@/hooks/use-show-in-content-area'
import { useActiveChat } from '@/hooks/use-chat'

export function Content() {
  const ref = useRef<HTMLDivElement>(null)
  const { setContentAreaRef } = useContentAreaRef()
  useEffect(() => {
    setContentAreaRef(ref)
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [])

  useActiveChat()

  return <main ref={ref} className="flex-1 overflow-y-auto bg-background relative"></main>
}
