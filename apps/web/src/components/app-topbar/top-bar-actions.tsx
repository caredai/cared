'use client'

import { ChevronsUpDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { Button } from '@cared/ui/components/button'

import { UserDropdownMenuContent } from '@/components/user-dropdown-menu-content'
import { useUser } from '@/hooks/use-user'
import { UserInfo } from '@/components/user-info'

export function TopBarActions() {
  const { user } = useUser()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
        >
          <UserInfo user={user} onlyAvatar />
        </Button>
      </DropdownMenuTrigger>
      <UserDropdownMenuContent user={user} />
    </DropdownMenu>
  )
}
