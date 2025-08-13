'use client'

import { FerrisWheel, Settings2, WandSparkles } from 'lucide-react'

import { NavMain } from '@/components/app-sidebar/nav-main'

const items = [
  {
    title: 'Design',
    url: '/',
    icon: WandSparkles,
  },
  {
    title: 'Logs',
    url: '/logs',
    icon: FerrisWheel,
  },
  {
    title: 'Configure',
    url: '/configure/api-key',
    icon: Settings2,
  },
]

export function AppNavMain({ baseUrl }: { baseUrl: string }) {
  return <NavMain items={items} baseUrl={baseUrl} />
}
