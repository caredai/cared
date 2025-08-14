'use client'

import Link from 'next/link'

import { Logo } from '@/components/logo'
import { OrganizationAndAccountSwitcher } from './organization-switcher'
import { TopBarActions } from './top-bar-actions'
import { WorkspaceSwitcher } from './workspace-switcher'

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full h-14 px-4 flex">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Logo />
          </Link>

          {/* Organization and Account Switcher */}
          <OrganizationAndAccountSwitcher />

          {/* Workspace Switcher - only show in workspace context */}
          <WorkspaceSwitcher />
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          <TopBarActions />
        </div>
      </div>
    </header>
  )
}
