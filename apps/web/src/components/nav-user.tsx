import { currentUser } from '@clerk/nextjs/server'
import { ChevronsUpDown } from 'lucide-react'
import superjson from 'superjson'

import { DropdownMenu, DropdownMenuTrigger } from '@mindworld/ui/components/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@mindworld/ui/components/sidebar'

import { NavUserContent } from '@/components/nav-user-content'
import { UserInfo } from './user-info'

export async function NavUser() {
  const user = superjson.parse(superjson.stringify(await currentUser()))
  if (!user) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserInfo user={user as any} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <NavUserContent user={user as any} />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
