import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { toast } from 'sonner'

import { log } from '@mindworld/utils'

import { useTRPC } from '@/trpc/client'

export function useWorkspaceId() {
  const pathname = usePathname()
  const matched = /\/(workspace_[^/]+)/.exec(pathname)
  return matched?.length && matched[1] ? matched[1] : ''
}

export function useWorkspace() {
  const router = useRouter()

  const id = useWorkspaceId()

  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data, error } = useQuery({
    ...trpc.workspace.get.queryOptions({
      id,
    }),
    enabled: !!id,
    initialData: () =>
      queryClient
        .getQueryData(trpc.workspace.list.queryOptions().queryKey)
        ?.workspaces.find((w) => w.workspace.id === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(trpc.workspace.list.queryOptions().queryKey)?.dataUpdatedAt,
  })

  const workspace = useMemo(
    () =>
      data && {
        ...data.workspace,
        role: data.role,
      },
    [data],
  )

  useEffect(() => {
    if (!id || error?.data?.code === 'NOT_FOUND') {
      log.error('Workspace not found', { id, error })
      toast.error('Workspace not found')
      router.replace('/')
    }
  }, [id, error, router])

  return workspace
}

const lastWorkspaceAtom = atomWithStorage<string | undefined>(
  'lastWorkspace',
  undefined,
  undefined,
  {
    getOnInit: true,
  },
)

export function useLastWorkspace() {
  const [lastWorkspace, setLastWorkspace] = useAtom(lastWorkspaceAtom)

  return [lastWorkspace, setLastWorkspace] as const
}

export type Workspace = ReturnType<typeof useQueryWorkspaces>[number]

const workspacesAtom = atom<Workspace[]>()

export function useWorkspaces() {
  const [workspaces] = useAtom(workspacesAtom)
  return workspaces
}

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
