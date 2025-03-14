import { useEffect, useMemo } from 'react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
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

  const trpc = useTRPC()
  const { data, error, status } = useQuery({
    ...trpc.workspace.get.queryOptions({
      id: workspace?.id ?? '',
    }),
    enabled: !!workspace,
  })

  useEffect(() => {
    if (workspace && status === 'success') {
      const queried = {
        ...data.workspace,
        role: data.role,
      }
      if (hash(workspace) !== hash(queried)) {
        setWorkspace(queried)
      }
    } else if (status === 'error' && error.data?.code === 'NOT_FOUND') {
      setWorkspace(undefined)
    }
  }, [data, error, status, setWorkspace, workspace])

  return [workspace, setWorkspace] as const
}

export type Workspace = ReturnType<typeof useQueryWorkspaces>[number]

export function useQueryWorkspaces() {
  const trpc = useTRPC()

  const { data } = useSuspenseQuery(trpc.workspace.list.queryOptions())

  const workspaces = useMemo(
    () => data.workspaces.map(({ workspace, role }) => ({ ...workspace, role })),
    [data],
  )

  const [, setWorkspaces] = useAtom(workspacesAtom)
  useEffect(() => {
    setWorkspaces(workspaces)
  }, [workspaces, setWorkspaces])

  const [workspace, setWorkspace] = useWorkspace()
  useEffect(() => {
    // Only set current workspace if it's not already set
    if (!workspace) {
      setWorkspace(workspaces.at(0))
    }
  }, [workspaces, workspace, setWorkspace])

  return workspaces
}
