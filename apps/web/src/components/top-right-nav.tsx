'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { UserIcon } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { DropdownMenu, DropdownMenuTrigger } from '@cared/ui/components/dropdown-menu'

import { UserDropdownMenuContent } from '@/components/user-dropdown-menu-content'
import { useSessionPublic } from '@/hooks/use-session'

export function TopRightNav() {
  const router = useRouter()
  const { user, isSuccess } = useSessionPublic()

  if (!isSuccess) {
    return null
  }

  return (
    <nav className="flex items-center gap-4">
      {!user ? (
        <Button variant="ghost" onClick={() => router.push('/auth/sign-in')}>
          Sign in
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <UserIcon />
            </Button>
          </DropdownMenuTrigger>
          <UserDropdownMenuContent user={user} />
        </DropdownMenu>
      )}
    </nav>
  )
}
