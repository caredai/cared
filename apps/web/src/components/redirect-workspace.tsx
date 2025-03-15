'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useLastWorkspace, useQueryWorkspaces } from '@/hooks/use-workspace'

export function RedirectWorkspace() {
  const router = useRouter()

  useQueryWorkspaces()

  const [workspace] = useLastWorkspace()

  useEffect(() => {
    if (workspace) {
      router.replace(`/${workspace}/apps`)
    }
  }, [router, workspace])

  return <></>
}
