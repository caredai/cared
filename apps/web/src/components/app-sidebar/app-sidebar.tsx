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
} from '@cared/ui/components/sidebar'

import { Logo } from '@/components/logo'
import { HydrateClient } from '@/trpc/server'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'

export function AppSidebar({
  baseUrl,
  children,
  ...props
}: {
  baseUrl: string
  children: ReactNode
} & ComponentProps<typeof Sidebar>) {
  return (
    <div className="![--sidebar-width:12rem]">
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href={baseUrl} className="mr-4 flex items-center gap-2 lg:mr-6">
                  <Logo />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* nav main */}
          {children}

          {/* nav secondary */}
          <NavSecondary className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <HydrateClient>
            {/* nav user */}
            <NavUser />
          </HydrateClient>
        </SidebarFooter>
      </Sidebar>
    </div>
  )
}
