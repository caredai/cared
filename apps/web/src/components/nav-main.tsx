import Link from 'next/link'
import { Bot, Brain, ChevronRight, Database, Puzzle, Settings2, Wrench } from 'lucide-react'

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

import { WorkspaceSwitcher } from '@/components/workspace-switcher'
import { HydrateClient } from '@/trpc/server'

const items: {
  title: string
  url: string
  icon: any
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}[] = [
  {
    title: 'Apps',
    url: '/apps',
    icon: Bot,
    isActive: true,
  },
  {
    title: 'Knowledge',
    url: '/datasets',
    icon: Database,
  },
  {
    title: 'Tools',
    url: '/tools',
    icon: Wrench,
  },
  {
    title: 'Models',
    url: '/models',
    icon: Brain,
  },
  {
    title: 'Extensions',
    url: '/extensions',
    icon: Puzzle,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings2,
  },
]

export function NavMain({ workspaceId }: { workspaceId: string }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <HydrateClient>
            <WorkspaceSwitcher />
          </HydrateClient>
        </SidebarMenuItem>

        <SidebarSeparator className="my-4" />

        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="my-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={`/${workspaceId}${item.url}`}>
                  <item.icon />
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
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={`/${workspaceId}${subItem.url}`}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
