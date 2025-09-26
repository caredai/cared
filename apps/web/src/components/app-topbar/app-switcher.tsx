import { Link } from '@tanstack/react-router'
import { Bot, ChevronsUpDown, Plus } from 'lucide-react'

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

import { CreateAppDialog } from '@/components/create-app-dialog'
import { useActive } from '@/hooks/use-active'
import { useApps, useReplaceRouteWithAppId } from '@/hooks/use-app'
import { stripIdPrefix } from '@/lib/utils'

export function AppSwitcher() {
  const { activeApp, activeWorkspace } = useActive()
  const apps = useApps({ workspaceId: activeWorkspace?.id })
  const replaceRouteWithAppId = useReplaceRouteWithAppId()

  const isMobile = useIsMobile()

  // Only show app switcher when in app context
  if (!activeApp || !activeWorkspace) {
    return null
  }

  const addAppMenuItem = (
    <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
        <Plus className="size-4" />
      </div>
      <div>Create app</div>
    </DropdownMenuItem>
  )

  return (
    <CreateAppDialog
      workspaceId={activeWorkspace.id}
      menu={({ trigger }) => (
        <div className="flex items-center">
          {/* Title button - displays current app name if available, otherwise shows "Apps" */}
          <Button
            variant="ghost"
            className="h-8 gap-2 px-1 has-[>svg]:px-1 text-sm font-medium hover:bg-inherit hover:text-inherit"
            asChild
          >
            <Link
              to="/app/$appId"
              params={{
                appId: stripIdPrefix(activeApp.app.id),
              }}
            >
              <Bot className="text-muted-foreground/70" />
              <span className="truncate max-w-20">{activeApp.app.name}</span>
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
              <DropdownMenuLabel className="text-xs text-muted-foreground">Apps</DropdownMenuLabel>
              {apps.map((app) => {
                const isActive = app.app.id === activeApp.app.id
                return (
                  <DropdownMenuItem
                    key={app.app.id}
                    className="max-w-56 gap-2 p-2 cursor-pointer"
                    asChild
                  >
                    <Link
                      to={replaceRouteWithAppId(app.app.id)}
                      className="flex w-full items-center gap-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Bot className="size-4 text-muted-foreground/70" />
                      </div>
                      <span className={cn('flex-1 truncate')}>{app.app.name}</span>
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
              {trigger({ children: addAppMenuItem })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    />
  )
}
