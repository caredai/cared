'use client'

import { usePathname } from 'next/navigation'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@mindworld/ui/components/breadcrumb'
import { Separator } from '@mindworld/ui/components/separator'

const titles: Record<string, string> = {
  mock: 'Mock',
}

export function AdminBreadcrumb() {
  const pathname = usePathname()
  const [, key] = pathname.split('/').filter(Boolean)
  const title = key && titles[key]

  if (!title) {
    return null
  }

  return (
    <>
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </>
  )
}
