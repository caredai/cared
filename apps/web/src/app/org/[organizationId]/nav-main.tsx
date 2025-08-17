'use client'

import {
  Boxes,
  Brain,
  CircleDollarSign,
  Settings2,
  Users,
} from 'lucide-react'

import { NavMain } from '@/components/app-sidebar/nav-main'

const items = [
  {
    title: 'Workspaces',
    url: '/workspaces',
    icon: Boxes,
  },
  {
    title: 'Credits',
    url: '/credits',
    icon: CircleDollarSign,
  },
  {
    title: 'Models',
    url: '/models',
    icon: Brain,
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
