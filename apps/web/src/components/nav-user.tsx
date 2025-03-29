import { ChevronsUpDown } from 'lucide-react'

import { DropdownMenu, DropdownMenuTrigger } from '@ownxai/ui/components/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@ownxai/ui/components/sidebar'

import { NavUserContent } from '@/components/nav-user-content'
import { HydrateClient } from '@/trpc/server'
import { UserInfo } from './user-info'

export function NavUser() {
  return (
    <HydrateClient>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <UserInfo />
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <NavUserContent />
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </HydrateClient>
  )
}
