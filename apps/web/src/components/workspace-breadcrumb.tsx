'use client'

import { usePathname } from 'next/navigation'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@mindworld/ui/components/breadcrumb'

const titles: Record<string, string> = {
  apps: 'Apps',
  datasets: 'Knowledge',
  tools: 'Tools',
  models: 'Models',
  extensions: 'Extensions',
  settings: 'Settings',
}

export function WorkspaceBreadcrumb() {
  const pathname = usePathname()
  const [, key] = pathname.split('/').filter(Boolean)
  const title = key && titles[key]

  if (!title) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
