import type { ReactNode } from 'react'
import { Activity, FerrisWheel, Settings2, WandSparkles } from 'lucide-react'

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
    title: 'Tracing',
    url: '/tracing',
    icon: Activity,
  },
  {
    title: 'Configure',
    url: '/configure/api-keys',
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
