import { Activity, Boxes, Brain, CircleDollarSign, Key, Settings2, Users } from 'lucide-react'

import type { NavItem } from '@/components/app-sidebar/nav-main'
import { NavMain } from '@/components/app-sidebar/nav-main'

const items: NavItem[] = [
  {
    title: 'Credits',
    url: '/credits',
    icon: CircleDollarSign,
    items: [
      {
        title: 'Usage',
        url: '/usage',
      },
    ],
  },
  {
    type: 'separator',
  },
  {
    title: 'Workspaces',
    url: '/workspaces',
    icon: Boxes,
  },
  {
    title: 'Models',
    url: '/models',
    icon: Brain,
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
    type: 'separator',
  },
  {
    title: 'Members',
    url: '/members',
    icon: Users,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings2,
  },
]

export function OrganizationNavMain({ baseUrl }: { baseUrl: string }) {
  return <NavMain items={items} baseUrl={baseUrl} />
}
