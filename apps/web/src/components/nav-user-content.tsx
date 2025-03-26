'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Bell, CreditCard, LogOut, Sparkles } from 'lucide-react'

import { authClient } from '@mindworld/auth/client'
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@mindworld/ui/components/dropdown-menu'
import { useIsMobile } from '@mindworld/ui/hooks/use-mobile'

import { ThemeSwitcher } from '@/components/theme'
import { UserInfo } from './user-info'

export function NavUserContent() {
  const router = useRouter()
  const isMobile = useIsMobile()

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/')
        },
      },
    })
  }

  return (
    <DropdownMenuContent
      className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
      side={isMobile ? 'bottom' : 'right'}
      align="end"
      sideOffset={4}
    >
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserInfo showEmail />
          <ThemeSwitcher />
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem className="cursor-pointer">
          <Sparkles />
          Upgrade to Pro
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/account/profile" className="cursor-pointer">
            <BadgeCheck />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <CreditCard />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Bell />
          Notifications
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={signOut} className="cursor-pointer">
        <LogOut />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
