import { Link } from '@tanstack/react-router'
import { ChevronsUpDown, Cylinder, Plus } from 'lucide-react'

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

import { CreateNamespaceDialog } from '@/components/databases/create-namespace-dialog'
import {
  useActive,
  useReplaceRouteWithDatabaseNamespaceId,
} from '@/hooks/use-active'
import { useDatabaseNamespaces } from '@/hooks/use-database'
import { stripIdPrefix } from '@/lib/utils'

export function useHasDatabaseSwitcher() {
  const { activeDatabaseNamespace } = useActive()
  return Boolean(activeDatabaseNamespace)
}

export function DatabaseSwitcher() {
  const { activeAccount, activeDatabaseNamespace } = useActive()
  const namespaces = useDatabaseNamespaces()
  const replaceRouteWithDatabaseNamespaceId = useReplaceRouteWithDatabaseNamespaceId()

  const isMobile = useIsMobile()

  if (!activeDatabaseNamespace || !activeAccount) {
    return null
  }

  const accountIdNoPrefix = stripIdPrefix(activeAccount.id)
  const databaseNamespaceIdNoPrefix = stripIdPrefix(activeDatabaseNamespace.id)

  const addNamespaceMenuItem = (
    <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
        <Plus className="size-4" />
      </div>
      <div>Create database namespace</div>
    </DropdownMenuItem>
  )

  return (
    <CreateNamespaceDialog
      accountIdNoPrefix={accountIdNoPrefix}
      menu={({ trigger }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="h-8 gap-2 px-1 has-[>svg]:px-1 text-sm font-medium hover:bg-inherit hover:text-inherit"
            asChild
          >
            <Link
              to="/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/dashboard"
              params={{
                accountIdNoPrefix,
                namespaceIdNoPrefix: databaseNamespaceIdNoPrefix,
              }}
            >
              <Cylinder className="text-muted-foreground/70" />
              <span className="truncate max-w-20">{activeDatabaseNamespace.name}</span>
            </Link>
          </Button>

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
                Database namespaces
              </DropdownMenuLabel>
              {namespaces.map((namespace) => {
                const isActive = namespace.id === activeDatabaseNamespace.id
                return (
                  <DropdownMenuItem
                    key={namespace.id}
                    className="max-w-56 gap-2 p-2 cursor-pointer"
                    asChild
                  >
                    <Link
                      to={replaceRouteWithDatabaseNamespaceId(namespace.id)}
                      className="flex w-full items-center gap-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Cylinder className="size-4 text-muted-foreground/70" />
                      </div>
                      <span className={cn('flex-1 truncate')}>{namespace.name}</span>
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
              {trigger({ children: addNamespaceMenuItem })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    />
  )
}
