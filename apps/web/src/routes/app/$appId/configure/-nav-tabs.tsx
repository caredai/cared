'use client'

import { useRouterState } from '@tanstack/react-router'

import { Tabs } from '@/components/tabs'

export default function NavTabs({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const item = './' + pathname.split('/').pop()

  return (
    <Tabs value={item} className="space-y-4">
      {children}
    </Tabs>
  )
}
