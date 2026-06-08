import { Brain, DatabaseZap } from 'lucide-react'

import { NavMain } from '@/components/app-sidebar/nav-main'
import { MenuBreadcrumb } from '@/components/menu-breadcrumb'

const items = [
  {
    title: 'Models',
    url: '/models',
    icon: Brain,
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
