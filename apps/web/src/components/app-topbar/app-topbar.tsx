import { Link } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { useSidebar } from '@cared/ui/components/sidebar'

import { Logo } from '@/components/logo'
import { Slash } from '@/components/slash'
import { useCheckSession } from '@/hooks/use-session'
import { AccountSwitcher } from './account-switcher'
import { AdminEnterButton } from './admin-enter-button'
import { DatabaseSwitcher, useHasDatabaseSwitcher } from './database-switcher'
import { TopBarActions } from './top-bar-actions'

export function AppTopBar() {
  useCheckSession()

  const { toggleSidebar } = useSidebar()
  const hasDatabaseSwitcher = useHasDatabaseSwitcher()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto w-full h-14 px-4 flex">
        <div className="flex items-center gap-1 md:gap-2">
          <Link to="/" className="p-1 hidden md:inline">
            <Logo />
          </Link>

          <Slash className="hidden md:inline" />

          <AccountSwitcher />

          {hasDatabaseSwitcher && <Slash className="hidden md:inline" />}

          {hasDatabaseSwitcher && <DatabaseSwitcher />}

          <AdminEnterButton />
        </div>

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
