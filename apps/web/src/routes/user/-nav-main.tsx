import {
  Bot,
  ShieldCheck,
  UserRound,
  Wallet,
  Key,
} from 'lucide-react'

import type { NavItem } from '@/components/app-sidebar/nav-main'
import { NavMain } from '@/components/app-sidebar/nav-main'

const items: NavItem[] = [
  {
    title: 'Wallet',
    url: '/wallet',
    icon: Wallet,
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
    title: 'API Tokens',
    url: '/api-tokens',
    icon: Key,
  },
  {
    title: 'Applications',
    url: '/applications',
    icon: Bot,
  },
]

export function UserNavMain() {
  return <NavMain items={items} baseUrl="/user" />
}
