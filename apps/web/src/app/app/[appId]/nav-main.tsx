'use client'

import type { ReactNode } from 'react'
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

export function AppNavMain({ baseUrl, children }: { baseUrl: string; children?: ReactNode }) {
  return (
    <NavMain items={items} baseUrl={baseUrl}>
      {children}
    </NavMain>
  )
}
