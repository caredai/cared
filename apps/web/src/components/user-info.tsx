'use client'

import type { User } from '@/hooks/use-user'

import { Avatar, AvatarImage } from '@cared/ui/components/avatar'

export function UserInfo({ user, showEmail }: { user: User; showEmail?: boolean }) {
  return (
    <>
      {user.image && (
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src={user.image} alt={user.name} />
        </Avatar>
      )}
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {showEmail && <span className="truncate text-xs">{user.email}</span>}
      </div>
    </>
  )
}
