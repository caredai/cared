'use client'

import type { ReactNode } from 'react'
import { Blocks, ChevronsUpDown, Plus } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@mindworld/ui/components/dropdown-menu'
import { SidebarMenuButton } from '@mindworld/ui/components/sidebar'
import { useIsMobile } from '@mindworld/ui/hooks/use-mobile'

import { ClientOnly } from '@/components/client-only'
import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog'
import { useWorkspace, useWorkspaces } from '@/hooks/use-workspace'

export function WorkspaceSwitcherInner({
  trigger,
}: {
  trigger?: (props: { children: ReactNode }) => ReactNode
}) {
  const [workspace, setWorkspace] = useWorkspace()
  const workspaces = useWorkspaces()

  const isMobile = useIsMobile()

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
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
        >
          <Blocks />
          <ClientOnly>
            <span className="truncate">{workspace?.name}</span>
          </ClientOnly>
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
        <ClientOnly>
          {workspaces?.map((workspace) => (
            <DropdownMenuItem
              key={workspace.name}
              onClick={() => setWorkspace(workspace)}
              className="gap-2 p-2 cursor-pointer"
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <Blocks />
              </div>
              {workspace.name}
            </DropdownMenuItem>
          ))}
        </ClientOnly>
        <DropdownMenuSeparator />
        {Trigger ? <Trigger>{addWorkspaceMenuItem}</Trigger> : addWorkspaceMenuItem}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function WorkspaceSwitcher() {
  return <CreateWorkspaceDialog menu={WorkspaceSwitcherInner} />
}
