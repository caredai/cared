import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
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
  useSidebar,
} from '@cared/ui/components/sidebar'

export type NavItem =
  | {
      type?: 'menu'
      title: string
      url: string
      icon: LucideIcon
      isRoute?: boolean
      items?: {
        title: string
        url: string
      }[]
    }
  | {
      type: 'separator'
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

  const isItemActive = (url: string) => {
    const baseRouteKeys = baseUrl.split('/').filter(Boolean)
    const routeKey = pathname.split('/').filter(Boolean).at(baseRouteKeys.length)
    const [urlKey] = url.split('/').filter(Boolean)
    return routeKey === urlKey
  }

  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {children && (
          <>
            <SidebarMenuItem>{children}</SidebarMenuItem>
            <SidebarSeparator className="my-4" />
          </>
        )}

        {items.map((item, index) => {
          if (item.type === 'separator') {
            return <SidebarSeparator key={index} className="my-2" />
          }

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
                    setOpenMobile(false)
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
                          const subActive = pathname.endsWith(url)
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={subActive}
                                onClick={() => {
                                  setOpenMobile(false)
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
