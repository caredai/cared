import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { toast } from 'sonner'

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
  const { data, error } = useSuspenseQuery({
    ...trpc.workspace.get.queryOptions({
      id,
    }),
    retry: (failureCount, error) => {
      return !(id.length < 32 || error.data?.code === 'NOT_FOUND')
    },
  })

  const workspace = useMemo(
    () => ({
      ...data.workspace,
      role: data.role,
    }),
    [data],
  )

  useEffect(() => {
    if (id.length < 32 || error?.data?.code === 'NOT_FOUND') {
      console.error('Workspace not found', { id, error })
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

export type Workspace = ReturnType<typeof useWorkspaces>[number]

export function useWorkspaces() {
  const trpc = useTRPC()

  const { data } = useSuspenseQuery(trpc.workspace.list.queryOptions())

  const workspaces = useMemo(
    () => data.workspaces.map(({ workspace, role }) => ({ ...workspace, role })),
    [data],
  )

  const [workspace, setWorkspace] = useLastWorkspace()
  useEffect(() => {
    if (!workspace) {
      // Set last workspace if it's not already set
      setWorkspace(workspaces.at(0)?.id)
    } else if (!workspaces.some((w) => w.id === workspace)) {
      // If last workspace is not in the list of workspaces, reset it
      setWorkspace(workspaces.at(0)?.id)
    }
  }, [workspaces, workspace, setWorkspace])

  return workspaces
}

export function replaceRouteWithWorkspaceId(route: string, id: string) {
  return route.replace(/^\/workspace_[^/]+/, `/${id}`)
}

export function useRouteWithWorkspaceId(id: string) {
  const pathname = usePathname()
  return replaceRouteWithWorkspaceId(pathname, id)
}
