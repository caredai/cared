'use client'

import { usePathname } from 'next/navigation'

import { Tabs } from '@cared/ui/components/tabs'

export default function NavTabs({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const item = './' + pathname.split('/').pop()

  return (
    <Tabs value={item} className="space-y-4">
      {children}
    </Tabs>
  )
}
