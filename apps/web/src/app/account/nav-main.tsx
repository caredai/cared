'use client'

import { Bot, Brain, CircleDollarSign, ShieldCheck, UserRound, Wallet } from 'lucide-react'

import { NavMain } from '@/components/app-sidebar/nav-main'

const items = [
  {
    title: 'Credits',
    url: '/credits',
    icon: CircleDollarSign,
  },
  {
    title: 'Wallet',
    url: '/wallet',
    icon: Wallet,
  },
  {
    title: 'Models',
    url: '/models',
    icon: Brain,
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
