'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useLastWorkspace, useWorkspaces } from '@/hooks/use-workspace'

export function RedirectWorkspace() {
  const router = useRouter()

  useWorkspaces()

  const [workspace] = useLastWorkspace()

  useEffect(() => {
    if (workspace) {
      router.replace(`/${workspace}/apps`)
    }
  }, [router, workspace])

  return <></>
}
