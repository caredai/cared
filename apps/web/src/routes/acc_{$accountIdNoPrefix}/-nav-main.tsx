import {
  Activity,
  Bot,
  Box,
  Brain,
  CircleDollarSign,
  Database,
  Key,
  PocketKnife,
  Puzzle,
  Settings2,
  Users,
  Cable
} from 'lucide-react'

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
    title: 'Models',
    url: '/models',
    icon: Brain,
  },
  {
    title: 'Tools',
    url: '/tools',
    icon: PocketKnife,
  },
  {
    title: 'MCP',
    url: '/mcp',
    icon: Cable,
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
    title: 'Sandboxes',
    url: '/sandboxes',
    icon: Box,
    items: [
      {
        title: 'Sandboxes',
        url: '/sandboxes',
      },
      {
        title: 'Snapshots',
        url: '/snapshots',
      },
      {
        title: 'Volumes',
        url: '/volumes',
      },
    ],
  },
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
    title: 'Extensions',
    url: '/extensions',
    icon: Puzzle,
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
    title: 'API Tokens',
    url: '/api-tokens',
    icon: Key,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings2,
  },
]

/**
 * Account navigation main component
 * Displays navigation items for account-level pages
 */
export function AccountNavMain({ baseUrl }: { baseUrl: string }) {
  return <NavMain items={items} baseUrl={baseUrl} />
}
