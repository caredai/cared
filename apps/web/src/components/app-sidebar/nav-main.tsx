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
  secondaryItems,
  secondaryLinkSearch,
  midSection,
  baseUrl,
  children,
}: {
  items: NavItem[]
  /** Optional second nav group rendered after midSection (e.g. branch-scoped pages). */
  secondaryItems?: NavItem[]
  /** Search params appended to secondary nav links (e.g. active branch id). */
  secondaryLinkSearch?: { branch?: string }
  /** Custom block between the primary and secondary nav groups (e.g. branch selector). */
  midSection?: ReactNode
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

        {[items, ...(secondaryItems ? [secondaryItems] : [])].map((group, groupIndex) => (
          <NavMainItemGroup
            key={groupIndex}
            items={group}
            baseUrl={baseUrl}
            pathname={pathname}
            isItemActive={isItemActive}
            setOpenMobile={setOpenMobile}
            linkSearch={groupIndex === 1 ? secondaryLinkSearch : undefined}
            leadingMidSection={groupIndex === 1 && midSection ? midSection : undefined}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavMainItemGroup({
  items,
  baseUrl,
  pathname,
  isItemActive,
  setOpenMobile,
  linkSearch,
  leadingMidSection,
}: {
  items: NavItem[]
  baseUrl: string
  pathname: string
  isItemActive: (url: string) => boolean
  setOpenMobile: (open: boolean) => void
  linkSearch?: { branch?: string }
  leadingMidSection?: ReactNode
}) {
  return (
    <>
      {leadingMidSection ? (
        <>
          <SidebarSeparator className="my-2" />
          <SidebarMenuItem className="mb-2">{leadingMidSection}</SidebarMenuItem>
        </>
      ) : null}

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
                <Link to={`${baseUrl}${item.url}`} search={linkSearch}>
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
                              <Link to={`${baseUrl}${url}`} search={linkSearch}>
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
    </>
  )
}
