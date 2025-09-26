import type { ReactNode } from 'react'
import { Activity, Bot, Database, Key, Puzzle, Settings2, Wrench } from 'lucide-react'

import { NavMain } from '@/components/app-sidebar/nav-main'
import { MenuBreadcrumb } from '@/components/menu-breadcrumb'

const items = [
  {
    title: 'Apps',
    url: '/apps',
    icon: Bot,
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
    title: 'Extensions',
    url: '/extensions',
    icon: Puzzle,
  },
  {
    title: 'API Keys',
    url: '/api-keys',
    icon: Key,
  },
  {
    title: 'Tracing',
    url: '/tracing',
    icon: Activity,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings2,
  },
]

export function WorkspaceNavMain({ baseUrl, children }: { baseUrl: string; children?: ReactNode }) {
  return (
    <NavMain items={items} baseUrl={baseUrl}>
      {children}
    </NavMain>
  )
}

export function WorkspaceMenuBreadcrumb({ baseUrl }: { baseUrl: string }) {
  return <MenuBreadcrumb items={items} baseUrl={baseUrl} />
}
