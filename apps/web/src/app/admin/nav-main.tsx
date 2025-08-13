'use client'

import { Bot, DatabaseZap } from 'lucide-react'

import { MenuBreadcrumb } from '@/components/menu-breadcrumb'
import { NavMain } from '@/components/app-sidebar/nav-main'

const items = [
  {
    title: 'Apps',
    url: '/apps',
    icon: Bot,
    isRoute: true,
    items: [
      {
        title: 'Categories',
        url: '/categories',
      },
      {
        title: 'Tags',
        url: '/tags',
      },
    ],
  },
  {
    title: 'Mock',
    url: '/mock',
    icon: DatabaseZap,
  },
]

export function AdminNavMain() {
  return <NavMain items={items} baseUrl="/admin" />
}

export function AdminMenuBreadcrumb() {
  return <MenuBreadcrumb items={items} baseUrl="/admin" />
}
