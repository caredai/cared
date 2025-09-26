import { Link } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { useSidebar } from '@cared/ui/components/sidebar'

import { Logo } from '@/components/logo'
import { useCheckSession } from '@/hooks/use-session'
import { AdminEnterButton } from './admin-enter-button'
import { AppSwitcher } from './app-switcher'
import { OrganizationAndAccountSwitcher } from './organization-switcher'
import { TopBarActions } from './top-bar-actions'
import { WorkspaceSwitcher } from './workspace-switcher'

export function AppTopBar() {
  useCheckSession()

  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto w-full h-14 px-4 flex">
        <div className="flex items-center gap-1 md:gap-4">
          <Link to="/" className="hidden md:inline">
            <Logo />
          </Link>

          {/* Organization and Account Switcher */}
          <OrganizationAndAccountSwitcher />

          {/* Workspace Switcher - only show in workspace context */}
          <WorkspaceSwitcher />

          {/* App Switcher - only show in workspace context */}
          <AppSwitcher />

          <AdminEnterButton />
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          <TopBarActions />

          <Button
            className="h-8 w-8 flex-inline md:hidden"
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
          >
            <MenuIcon />
          </Button>
        </div>
      </div>
    </header>
  )
}
