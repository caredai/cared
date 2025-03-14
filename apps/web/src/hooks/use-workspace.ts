import { useEffect, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import hash from 'stable-hash'

import { useTRPC } from '@/trpc/client'

const workspaceAtom = atomWithStorage<Workspace | undefined>(
  'currentWorkspace',
  undefined,
  undefined,
  {
    getOnInit: true,
  },
)
const workspacesAtom = atomWithStorage<Workspace[] | undefined>(
  'workspaces',
  undefined,
  undefined,
  {
    getOnInit: true,
  },
)

export function useWorkspaces() {
  const [workspaces] = useAtom(workspacesAtom)
  return workspaces
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useAtom(workspaceAtom)

  return [workspace, setWorkspace] as const
}

function useSetWorkspace(workspaces: Workspace[]) {
  const [_workspace, setWorkspace] = useAtom(workspaceAtom)

  useEffect(() => {
    if (!workspaces.length) {
      setWorkspace(undefined)
      return
    }

    let workspace = _workspace
    if (workspace) {
      // Find the workspace by ID
      const found = workspaces.find((w) => w.id === workspace!.id)
      if (!found) {
        workspace = undefined
      } else if (hash(found) !== hash(workspace)) {
        workspace = found
      }
    }
    if (!workspace) {
      // Fallback to the first workspace
      workspace = workspaces.at(0)!
    }

    setWorkspace(workspace)
  }, [workspaces, _workspace, setWorkspace])
}

export type Workspace = ReturnType<typeof useQueryWorkspaces>[number]

export function useQueryWorkspaces() {
  const trpc = useTRPC()

  const { data } = useSuspenseQuery(trpc.workspace.list.queryOptions())

  const workspaces = useMemo(
    () => data.workspaces.map(({ workspace, role }) => ({ ...workspace, role })),
    [data],
  )

  useSetWorkspace(workspaces)

  const [, setWorkspaces] = useAtom(workspacesAtom)
  useEffect(() => {
    setWorkspaces(workspaces)
  }, [workspaces, setWorkspaces])

  return workspaces
}
