'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Boxes, ChevronsUpDown, Plus, UserIcon } from 'lucide-react'

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

import { CreateOrganizationDialog } from '@/components/create-organization-dialog'
import { UserInfo } from '@/components/user-info'
import { useActive } from '@/hooks/use-active'
import {
  useOrganizations,
  useReplaceRouteWithOrganizationId,
  useSetLastOrganization,
} from '@/hooks/use-organization'
import { useSession } from '@/hooks/use-session'
import { stripIdPrefix } from '@/lib/utils'

export function OrganizationAndAccountSwitcherInner({
  trigger,
}: {
  trigger?: (props: { children: ReactNode }) => ReactNode
}) {
  const { user } = useSession()
  const organizations = useOrganizations()
  const { activeOrganization, activeWorkspace } = useActive()
  const { setLastOrganization } = useSetLastOrganization()
  const router = useRouter()
  const replaceRouteWithOrganizationId = useReplaceRouteWithOrganizationId()

  const isMobile = useIsMobile()

  const handleOrganizationSelect = async (organizationId: string) => {
    await setLastOrganization(organizationId, true)
    if (!activeOrganization || activeWorkspace) {
      // If in account or workspace page, navigate to the organization page
      router.push(`/org/${stripIdPrefix(organizationId)}`)
    } else {
      router.push(replaceRouteWithOrganizationId(organizationId))
    }
  }

  const handleAccountSelect = async () => {
    await setLastOrganization(undefined, true)
    router.push('/account/credits')
  }

  const addOrganizationMenuItem = (
    <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
      <div className="flex size-6 items-center justify-center rounded-md border bg-muted">
        <Plus className="size-4" />
      </div>
      <div>Create Organization</div>
    </DropdownMenuItem>
  )

  const Trigger = trigger

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        className="h-8 gap-2 px-1 has-[>svg]:px-1 text-sm font-medium hover:bg-inherit hover:text-inherit"
        onClick={() => {
          if (activeOrganization) {
            router.push(`/org/${stripIdPrefix(activeOrganization.id)}`)
          } else {
            router.push(`/account/credits`)
          }
        }}
      >
        {!activeOrganization ? (
          <>
            <UserIcon className="size-4 text-muted-foreground" />
            Account
          </>
        ) : (
          <>
            <Boxes className="size-4 text-muted-foreground" />
            <span className="truncate max-w-30">{activeOrganization.name}</span>
          </>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 px-2 has-[>svg]:px-2 text-sm font-medium">
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
            Organizations
          </DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              disabled={org.id === activeOrganization?.id}
              onClick={() => handleOrganizationSelect(org.id)}
              className={cn(
                'max-w-56 gap-2 p-2',
                org.id !== activeOrganization?.id && 'cursor-pointer',
              )}
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <Boxes className="size-4 text-muted-foreground" />
              </div>
              <span className={cn('flex-1 truncate')}>{org.name}</span>
              {org.id === activeOrganization?.id && (
                <div className="ml-2 flex items-center">
                  <div className="size-2 rounded-full bg-primary" aria-hidden="true" />
                </div>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {Trigger ? <Trigger>{addOrganizationMenuItem}</Trigger> : addOrganizationMenuItem}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Account</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleAccountSelect} className="gap-2 p-2 cursor-pointer">
            <UserInfo user={user} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function OrganizationAndAccountSwitcher() {
  return <CreateOrganizationDialog menu={OrganizationAndAccountSwitcherInner} />
}
