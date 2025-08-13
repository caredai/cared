'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cared/ui/components/breadcrumb'
import { Separator } from '@cared/ui/components/separator'

import type { NavItem } from './app-sidebar/nav-main'

export function MenuBreadcrumb({ items, baseUrl }: { items: NavItem[]; baseUrl: string }) {
  const pathname = usePathname()
  const [, key, subKey] = pathname.split('/').filter(Boolean)

  const item = items.find((item) => item.url.startsWith(`/${key}`))
  const subItem = item?.items?.find((subItem) => subItem.url.startsWith(`/${subKey}`))

  if (!item) {
    return null
  }

  return (
    <>
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      {!subItem ? (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage>{item.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ) : (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              {item.isRoute ? (
                <BreadcrumbLink asChild>
                  <Link href={`${baseUrl}/${key}`}>{item.title}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{subItem.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </>
  )
}
