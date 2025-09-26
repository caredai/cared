import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cared/ui/components/collapsible'
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
} from '@cared/ui/components/sidebar'

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
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
  const location = useLocation()
  const pathname = location.pathname
  const [activeUrl, setActiveUrl] = useState<string>()

  const isItemActive = (url: string) => {
    // If we have an activeUrl from click, use that
    if (activeUrl?.startsWith(url)) return true

    // Otherwise fall back to pathname matching
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
          const Icon = item.icon
          return (
            <Collapsible key={item.title} asChild defaultOpen={active} className="my-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={active}
                  onClick={() => {
                    // Set active state immediately on click
                    setActiveUrl(item.url)
                  }}
                >
                  <Link to={`${baseUrl}${item.url}`}>
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
                      <SidebarMenuSub className="mt-1">
                        {item.items.map((subItem) => {
                          const url = `${item.url}${subItem.url}`
                          const subActive = activeUrl === url || pathname.endsWith(url)
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={subActive}
                                onClick={() => {
                                  // Set active state immediately on click
                                  setActiveUrl(url)
                                }}
                              >
                                <Link to={`${baseUrl}${url}`}>
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
