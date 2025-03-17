import type { ComponentProps, ReactNode } from 'react'
import Link from 'next/link'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@mindworld/ui/components/sidebar'

import { Logo } from '@/components/logo'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'

export function AppSidebar({
  mainRoute,
  children,
  ...props
}: {
  mainRoute: string
  children: ReactNode
} & ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={mainRoute} className="mr-4 flex items-center gap-2 lg:mr-6">
                <Logo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {children}
        <NavSecondary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
