'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bot,
  Brain,
  ChevronRight,
  Database,
  DatabaseZap,
  FerrisWheel,
  Puzzle,
  Settings2,
  ShieldCheck,
  UserRound,
  WandSparkles,
  Wrench,
} from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@mindworld/ui/components/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@mindworld/ui/components/sidebar'

const icons: Record<string, LucideIcon> = {
  Bot,
  Brain,
  Database,
  Puzzle,
  Settings2,
  Wrench,
  DatabaseZap,
  UserRound,
  ShieldCheck,
  FerrisWheel,
  WandSparkles,
}

export interface NavItem {
  title: string
  url: string
  icon: string
  isRoute?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({
  items,
  baseUrl,
  children,
}: {
  items: NavItem[]
  baseUrl: string
  children?: ReactNode
}) {
  const pathname = usePathname()

  const isItemActive = (url: string) => {
    const baseRouteKeys = baseUrl.split('/').filter(Boolean)
    const routeKey = pathname.split('/').filter(Boolean).at(baseRouteKeys.length)
    const [urlKey] = url.split('/').filter(Boolean)
    return routeKey === urlKey
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {children && (
          <>
            <SidebarMenuItem>{children}</SidebarMenuItem>
            <SidebarSeparator className="my-4" />
          </>
        )}

        {items.map((item) => {
          const active = isItemActive(item.url)
          const Icon = icons[item.icon]!
          return (
            <Collapsible key={item.title} asChild defaultOpen={active} className="my-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
                  <Link href={`${baseUrl}${item.url}`}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const url = `${item.url}${subItem.url}`
                          const subActive = pathname.endsWith(url)
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={subActive}>
                                <Link href={`${baseUrl}${url}`}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
