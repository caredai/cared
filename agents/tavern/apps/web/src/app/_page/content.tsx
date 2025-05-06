'use client'

import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'
import { atom, useAtom } from 'jotai'

const contentRefAtom = atom<RefObject<HTMLDivElement | null>>()

export function useContentRef() {
  const [contentRef] = useAtom(contentRefAtom)
  return contentRef
}

export function Content() {
  const ref = useRef<HTMLDivElement>(null)
  const [, setContentRef] = useAtom(contentRefAtom)
  useEffect(() => {
    setContentRef(ref)
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [])

  return <main ref={ref} className="flex-1 overflow-y-auto bg-background relative"></main>
}
