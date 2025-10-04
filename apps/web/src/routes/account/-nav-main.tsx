import {
  Activity,
  Bot,
  Brain,
  CircleDollarSign,
  Key,
  ShieldCheck,
  UserRound,
  Wallet,
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
    title: 'Wallet',
    url: '/wallet',
    icon: Wallet,
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
    title: 'Profile',
    url: '/profile',
    icon: UserRound,
  },
  {
    title: 'Security',
    url: '/security',
    icon: ShieldCheck,
  },
  {
    title: 'Applications',
    url: '/applications',
    icon: Bot,
  },
]

export function AccountNavMain() {
  return <NavMain items={items} baseUrl="/account" />
}
