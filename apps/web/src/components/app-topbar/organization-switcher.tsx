'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronsUpDown, Plus, UserIcon } from 'lucide-react'

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
import {
  useOrganization,
  useOrganizations,
  useReplaceRouteWithOrganizationId,
  useSetLastOrganization,
} from '@/hooks/use-organization'
import { useUser } from '@/hooks/use-user'
import { stripIdPrefix } from '@/lib/utils'

export function OrganizationAndAccountSwitcherInner({
  trigger,
}: {
  trigger?: (props: { children: ReactNode }) => ReactNode
}) {
  const { user } = useUser()
  const organizations = useOrganizations()
  const currentOrganization = useOrganization()
  const setLastOrganization = useSetLastOrganization()
  const router = useRouter()
  const replaceRouteWithOrganizationId = useReplaceRouteWithOrganizationId()

  const isMobile = useIsMobile()

  const handleOrganizationSelect = async (organizationId: string) => {
    await setLastOrganization(organizationId)
    if (currentOrganization) {
      router.push(replaceRouteWithOrganizationId(organizationId))
    } else {
      router.push(`/org/${stripIdPrefix(organizationId)}`)
    }
  }

  const handleAccountSelect = () => {
    // Navigate to account credits page
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 gap-2 px-2 text-sm font-medium">
          {!currentOrganization ? (
            <>
              <UserIcon className="size-4" />
              Account
            </>
          ) : (
            <>
              <Building2 className="size-4" />
              <span className="truncate max-w-30">{currentOrganization.name}</span>
            </>
          )}
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
            disabled={org.id === currentOrganization?.id}
            onClick={() => handleOrganizationSelect(org.id)}
            className={cn('max-w-56 gap-2 p-2', org.id !== currentOrganization?.id && 'cursor-pointer')}
          >
            <div className="flex size-6 items-center justify-center rounded-sm border">
              <Building2 className="size-4" />
            </div>
            <span className="truncate">{org.name}</span>
            {org.id === currentOrganization?.id && (
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
  )
}

export function OrganizationAndAccountSwitcher() {
  return <CreateOrganizationDialog menu={OrganizationAndAccountSwitcherInner} />
}
