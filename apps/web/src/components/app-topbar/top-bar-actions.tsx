'use client'

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { Button } from '@cared/ui/components/button'

import { UserDropdownMenuContent } from '@/components/user-dropdown-menu-content'
import { useSession } from '@/hooks/use-session'
import { UserInfo } from '@/components/user-info'

export function TopBarActions() {
  const { user } = useSession()

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
