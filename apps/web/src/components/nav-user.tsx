'use client'

import { ChevronsUpDown } from 'lucide-react'

import { DropdownMenu, DropdownMenuTrigger } from '@cared/ui/components/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@cared/ui/components/sidebar'

import { UserDropdownMenuContent } from '@/components/user-dropdown-menu-content'
import { useUser } from '@/hooks/use-user'
import { UserInfo } from './user-info'

export function NavUser() {
  const { user } = useUser()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserInfo user={user} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <UserDropdownMenuContent user={user} />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
