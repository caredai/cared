'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

// Import CreateAppDialog from the workspace apps directory
import { CreateAppDialog } from '@/app/workspace/[workspaceId]/apps/create-app-dialog'
import { useActive } from '@/hooks/use-active'
import { useApps, useReplaceRouteWithAppId } from '@/hooks/use-app'
import { stripIdPrefix } from '@/lib/utils'

export function AppSwitcher() {
  const router = useRouter()

  const { activeApp, activeWorkspace } = useActive()
  const apps = useApps({ workspaceId: activeWorkspace?.id })
  const replaceRouteWithAppId = useReplaceRouteWithAppId()

  const isMobile = useIsMobile()

  // Only show app switcher when in app context
  if (!activeApp || !activeWorkspace) {
    return null
  }

  const handleAppSelect = (appId: string) => {
    router.push(replaceRouteWithAppId(appId))
  }

  const addAppMenuItem = (
    <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
        <Plus className="size-4" />
      </div>
      <div className="font-medium text-muted-foreground">Create app</div>
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
            <Link href={`/app/${stripIdPrefix(activeApp.app.id)}`}>
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
              {apps.map((app) => (
                <DropdownMenuItem
                  key={app.app.id}
                  disabled={app.app.id === activeApp.app.id}
                  onClick={() => handleAppSelect(app.app.id)}
                  className={cn(
                    'max-w-56 gap-2 p-2',
                    app.app.id !== activeApp.app.id && 'cursor-pointer',
                  )}
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Bot className="size-4 text-muted-foreground/70" />
                  </div>
                  <span className={cn('flex-1 truncate')}>{app.app.name}</span>
                  {app.app.id === activeApp.app.id && (
                    <div className="ml-2 flex items-center">
                      <div className="size-2 rounded-full bg-primary" aria-hidden="true" />
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {trigger({ children: addAppMenuItem })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    />
  )
}
