'use client'

import Link from 'next/link'
import { Box, ChevronsUpDown, Plus } from 'lucide-react'

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
import { useActive } from '@/hooks/use-active'
import {
  useLastWorkspace,
  useReplaceRouteWithWorkspaceId,
  useWorkspaces,
} from '@/hooks/use-workspace'
import { stripIdPrefix } from '@/lib/utils'

export function WorkspaceSwitcher() {
  const { activeWorkspace, activeApp } = useActive()
  const workspaces = useWorkspaces(activeWorkspace?.organizationId)
  const [, setLastWorkspace] = useLastWorkspace()
  const replaceRouteWithWorkspaceId = useReplaceRouteWithWorkspaceId()

  const isMobile = useIsMobile()

  if (!activeWorkspace) {
    return null
  }

  const addWorkspaceMenuItem = (
    <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
        <Plus className="size-4" />
      </div>
      <div>Create workspace</div>
    </DropdownMenuItem>
  )

  return (
    <CreateWorkspaceDialog
      organizationId={activeWorkspace.organizationId}
      menu={({ trigger }) => (
        <div className="flex items-center">
          {/* Title button - displays current workspace name */}
          <Button
            variant="ghost"
            className="h-8 gap-2 px-1 has-[>svg]:px-1 text-sm font-medium hover:bg-inherit hover:text-inherit"
            asChild
          >
            <Link href={`/workspace/${stripIdPrefix(activeWorkspace.id)}`}>
              <Box className="text-muted-foreground/70" />
              <span className={cn('truncate max-w-20 md:inline', activeApp && 'hidden')}>
                {activeWorkspace.name}
              </span>
            </Link>
          </Button>

          {/* Dropdown menu button - only shows chevron icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 px-1.5 has-[>svg]:px-1.5 text-sm font-medium">
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
              {workspaces.map((space) => {
                const isActive = space.id === activeWorkspace.id

                return (
                  <DropdownMenuItem
                    key={space.id}
                    className="max-w-56 gap-2 p-2 cursor-pointer"
                    asChild
                  >
                    <Link
                      href={replaceRouteWithWorkspaceId(space.id)}
                      className="flex w-full items-center gap-2"
                      onClick={() => setLastWorkspace(space.id)}
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Box className="size-4 text-muted-foreground/70" />
                      </div>
                      <span className={cn('flex-1 truncate')}>{space.name}</span>
                      {isActive && (
                        <div className="ml-2 flex items-center">
                          <div className="size-1.5 rounded-full bg-green-500" aria-hidden="true" />
                        </div>
                      )}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              {trigger({ children: addWorkspaceMenuItem })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    />
  )
}
