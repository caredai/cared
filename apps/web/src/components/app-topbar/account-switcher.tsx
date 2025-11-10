import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Boxes, ChevronsUpDown, Plus, UserIcon } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { useIsMobile } from '@cared/ui/hooks/use-mobile'
import { cn } from '@cared/ui/lib/utils'

import { CreateAccountDialog } from '@/components/create-account-dialog'
import { UserInfo } from '@/components/user-info'
import { useAccounts, useReplaceRouteWithAccountId, useSetLastAccount } from '@/hooks/use-account'
import { useActive } from '@/hooks/use-active'
import { useSession } from '@/hooks/use-session'
import { stripIdPrefix } from '@/lib/utils'

export function AccountSwitcherInner({
  trigger,
}: {
  trigger?: (props: { children: ReactNode }) => ReactNode
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useSession()
  const accounts = useAccounts()
  const { activeAccount } = useActive()
  const { setLastAccount } = useSetLastAccount()
  const replaceRouteWithAccountId = useReplaceRouteWithAccountId()

  const isMobile = useIsMobile()

  const addAccountMenuItem = (
    <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
      <div className="flex size-6 items-center justify-center rounded-md border bg-muted">
        <Plus className="size-4" />
      </div>
      <div>Create Account</div>
    </DropdownMenuItem>
  )

  const Trigger = trigger

  const handleAccountClick = async (e: React.MouseEvent, accountId: string, href: string) => {
    e.preventDefault() // Prevent default navigation
    setIsOpen(false) // Close the dropdown menu
    await setLastAccount(accountId, true)
    void router.navigate({ to: href })
  }

  const handleUserClick = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent default navigation
    setIsOpen(false) // Close the dropdown menu
    void router.navigate({ to: '/user' })
  }

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        className="h-8 gap-2 px-1 has-[>svg]:px-1 text-sm font-medium hover:bg-inherit hover:text-inherit"
        asChild
      >
        <Link
          to={activeAccount ? `/acc_{$accountIdNoPrefix}` : `/user`}
          params={
            activeAccount ? { accountIdNoPrefix: stripIdPrefix(activeAccount.id) } : undefined
          }
        >
          {!activeAccount ? (
            <>
              <UserIcon className="size-4 text-muted-foreground" />
              User
            </>
          ) : (
            <>
              <Boxes className="text-muted-foreground/70" />
              <span className="truncate max-w-20 md:inline">{activeAccount.name}</span>
            </>
          )}
        </Link>
      </Button>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 px-1.5 has-[>svg]:px-1.5 text-sm font-medium">
            <ChevronsUpDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          side={isMobile ? 'bottom' : 'right'}
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">Accounts</DropdownMenuLabel>
          {accounts.map((account) => {
            const isActive = account.id === activeAccount?.id
            const href = !activeAccount
              ? `/acc_${stripIdPrefix(account.id)}`
              : replaceRouteWithAccountId(account.id)

            return (
              <DropdownMenuItem
                key={account.id}
                className="max-w-56 gap-2 p-2 cursor-pointer"
                asChild
              >
                <Link
                  to={href}
                  className="flex w-full items-center gap-2"
                  onClick={(e: React.MouseEvent) => handleAccountClick(e, account.id, href)}
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Boxes className="size-4 text-muted-foreground/70" />
                  </div>
                  <span className={cn('flex-1 truncate')}>{account.name}</span>
                  {isActive && (
                    <div className="ml-2 flex items-center">
                      <div className="size-1.5 rounded-full bg-green-500" aria-hidden="true" />
                    </div>
                  )}
                </Link>
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          {Trigger ? <Trigger>{addAccountMenuItem}</Trigger> : addAccountMenuItem}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">User</DropdownMenuLabel>
          <DropdownMenuItem className="gap-2 p-2 cursor-pointer" asChild>
            <Link to="/user" className="flex w-full items-center gap-2" onClick={handleUserClick}>
              <UserInfo user={user} />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function AccountSwitcher() {
  return <CreateAccountDialog menu={AccountSwitcherInner} />
}
