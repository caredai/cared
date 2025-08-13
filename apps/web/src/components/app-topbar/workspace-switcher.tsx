'use client'

import { useRouter } from 'next/navigation'
import { Blocks, ChevronsUpDown, Plus } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { useIsMobile } from '@cared/ui/hooks/use-mobile'
import { cn } from '@cared/ui/lib/utils'

import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog'
import { useReplaceRouteWithWorkspaceId, useWorkspace, useWorkspaces } from '@/hooks/use-workspace'

export function WorkspaceSwitcher({ organizationId }: { organizationId: string }) {
  const router = useRouter()

  const workspaces = useWorkspaces(organizationId)
  const workspace = useWorkspace()
  const replaceRouteWithWorkspaceId = useReplaceRouteWithWorkspaceId()

  const isMobile = useIsMobile()

  const handleWorkspaceSelect = (workspaceId: string) => {
    const route = replaceRouteWithWorkspaceId(workspaceId)
    router.push(route)
  }

  const addWorkspaceMenuItem = (
    <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
        <Plus className="size-4" />
      </div>
      <div className="font-medium text-muted-foreground">Create workspace</div>
    </DropdownMenuItem>
  )

  if (!workspace) {
    router.replace('/')
    return null
  }

  return (
    <CreateWorkspaceDialog
      organizationId={workspace.organizationId}
      menu={({ trigger }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2 text-sm font-normal">
              <Blocks className="size-4" />
              <span className="truncate max-w-[120px]">{workspace.name}</span>
              <ChevronsUpDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((space) => (
              <DropdownMenuItem
                key={space.id}
                disabled={space.id === workspace.id}
                onClick={() => handleWorkspaceSelect(space.id)}
                className={cn('gap-2 p-2', space.id !== workspace.id && 'cursor-pointer')}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Blocks className="size-4" />
                </div>
                <span className="truncate">{space.name}</span>
                {space.id === workspace.id && (
                  <div className="ml-2 flex items-center">
                    <div className="size-2 rounded-full bg-primary" aria-hidden="true" />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {trigger({ children: addWorkspaceMenuItem })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  )
}
