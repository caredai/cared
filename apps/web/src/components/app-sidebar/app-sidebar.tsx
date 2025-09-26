import type { ComponentProps, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@cared/ui/components/sidebar'
import { cn } from '@cared/ui/lib/utils'

import { Logo } from '@/components/logo'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'

export function AppSidebar({
  baseUrl,
  alwaysShowLogo,
  showNavUser,
  children,
  ...props
}: {
  baseUrl: string
  alwaysShowLogo?: boolean
  showNavUser?: boolean
  children: ReactNode
} & ComponentProps<typeof Sidebar>) {
  return (
    <div className="![--sidebar-width:12rem]">
      <Sidebar variant="inset" className="border-r" {...props}>
        <div className={cn(!alwaysShowLogo && 'block md:hidden')}>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="h-10 py-1" asChild>
                  <Link to={baseUrl} className="mr-4 flex items-center gap-2 lg:mr-6">
                    <Logo />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarSeparator className="mx-0" />
        </div>
        {!alwaysShowLogo && <div className="hidden md:block h-12" />}
        <SidebarContent>
          {/* nav main */}
          {children}

          {/* nav secondary */}
          <NavSecondary className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          {/* nav user */}
          {showNavUser && <NavUser />}
        </SidebarFooter>
      </Sidebar>
    </div>
  )
}
