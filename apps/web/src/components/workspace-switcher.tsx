'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Blocks, ChevronsUpDown, Plus } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { SidebarMenuButton } from '@cared/ui/components/sidebar'
import { useIsMobile } from '@cared/ui/hooks/use-mobile'
import { cn } from '@cared/ui/lib/utils'

import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog'
import { useActive } from '@/hooks/use-active'
import { useReplaceRouteWithWorkspaceId, useWorkspaces } from '@/hooks/use-workspace'

export function WorkspaceSwitcherInner({
  trigger,
}: {
  trigger?: (props: { children: ReactNode }) => ReactNode
}) {
  const router = useRouter()

  const { activeWorkspace } = useActive()
  const workspaces = useWorkspaces(activeWorkspace?.organizationId)
  const replaceRouteWithWorkspaceId = useReplaceRouteWithWorkspaceId()

  const isMobile = useIsMobile()

  if (!activeWorkspace) {
    router.replace('/')
    return null
  }

  const addWorkspaceMenuItem = (
    <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
        <Plus className="size-4" />
      </div>
      <div className="font-medium text-muted-foreground">Add workspace</div>
    </DropdownMenuItem>
  )

  const Trigger = trigger

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton>
          <Blocks />
          <span className="truncate">{activeWorkspace.name}</span>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        side={isMobile ? 'bottom' : 'right'}
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
        {workspaces.map((space) => {
          const route = replaceRouteWithWorkspaceId(space.id)
          return (
            <DropdownMenuItem
              key={space.id}
              disabled={space.id === activeWorkspace.id}
              onClick={() => router.push(route)}
              className={cn('gap-2 p-2', space.id !== activeWorkspace.id && 'cursor-pointer')}
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <Blocks />
              </div>
              <span className="truncate">{space.name}</span>
              {space.id === activeWorkspace.id && (
                <div className="ml-2 flex items-center">
                  <div className="size-2 rounded-full bg-primary" aria-hidden="true" />
                </div>
              )}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        {Trigger ? <Trigger>{addWorkspaceMenuItem}</Trigger> : addWorkspaceMenuItem}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function WorkspaceSwitcher({ organizationId }: { organizationId: string }) {
  return <CreateWorkspaceDialog organizationId={organizationId} menu={WorkspaceSwitcherInner} />
}
