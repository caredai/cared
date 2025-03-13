import { useEffect, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import hash from 'stable-hash'

import { useTRPC } from '@/trpc/client'

const workspaceIdAtom = atomWithStorage<string | undefined>(
  'currentWorkspace',
  undefined,
  undefined,
  {
    getOnInit: true,
  },
)

export function useWorkspace() {
  const workspaces = useWorkspaces()
  const [workspaceId, setWorkspaceId] = useAtom(workspaceIdAtom)
  const [workspace, setWorkspace] = useState<(typeof workspaces)[0]>()

  useEffect(() => {
    if (!workspaces.length) {
      return
    }

    let workspace: (typeof workspaces)[0] | undefined
    // Find the workspace by ID
    if (workspaceId) {
      workspace = workspaces.find((w) => w.workspace.id === workspaceId)
    }
    if (!workspace) {
      // Fallback to the first workspace
      workspace = workspaces.at(0)!
      setWorkspaceId(workspace.workspace.id)
    }

    setWorkspace((w) => {
      if (!w || hash(w) !== hash(workspace)) {
        return workspace
      } else {
        return w
      }
    })
  }, [workspaces, workspaceId, setWorkspaceId])

  return [workspace, setWorkspaceId]
}

export function useWorkspaces() {
  const trpc = useTRPC()
  const {
    data: { workspaces },
  } = useSuspenseQuery(trpc.workspace.list.queryOptions())
  return workspaces
}
