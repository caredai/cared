'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import { useContentAreaRef } from '@/hooks/use-show-in-content-area'

export function ContentArea({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { setContentAreaRef } = useContentAreaRef()
  useEffect(() => {
    setContentAreaRef(ref)
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [])

  return (
    <main ref={ref} className="flex-1 overflow-y-auto bg-background relative">
      {children}
    </main>
  )
}
