import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import hash from 'stable-hash'

import { useTRPC } from '@/trpc/client'

const lastWorkspaceAtom = atomWithStorage<string | undefined>(
  'lastWorkspace',
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

export function useWorkspaceId() {
  const pathname = usePathname()
  const matched = /\/(workspace_[^/]+)/.exec(pathname)
  return matched?.length && matched[1] ? matched[1] : ''
}

export function useWorkspace() {
  const router = useRouter()

  const workspaces = useWorkspaces()
  const id = useWorkspaceId()
  const [workspace, setWorkspace] = useState<Workspace>()

  useEffect(() => {
    const found = workspaces?.find((w) => w.id === id)
    if (found) {
      setWorkspace(found)
    }
  }, [id, workspaces])

  const trpc = useTRPC()
  const { status, data } = useQuery({
    ...trpc.workspace.get.queryOptions({
      id,
    }),
    enabled: !!id,
  })

  useEffect(() => {
    if (status === 'success') {
      const queried = {
        ...data.workspace,
        role: data.role,
      }
      if (hash(workspace) !== hash(queried)) {
        setWorkspace(queried)
      }
    } else if (!id || status === 'error') {
      router.replace('/')
    }
  }, [id, status, data, workspace, router])

  return workspace
}

export function useLastWorkspace() {
  const [lastWorkspace, setLastWorkspace] = useAtom(lastWorkspaceAtom)

  return [lastWorkspace, setLastWorkspace] as const
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

  const [workspace, setWorkspace] = useLastWorkspace()
  useEffect(() => {
    // Only set current workspace if it's not already set
    if (!workspace) {
      setWorkspace(workspaces.at(0)?.id)
    }
  }, [workspaces, workspace, setWorkspace])

  return workspaces
}
