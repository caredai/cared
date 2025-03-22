'use client'

import { Avatar, AvatarImage } from '@mindworld/ui/components/avatar'

import { useUser } from '@/hooks/use-user'

export function UserInfo() {
  const user = useUser()

  return (
    <>
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={user.image ?? '/images/thinker.png'} alt={user.username ?? ''} />
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs">{user.username ?? user.email}</span>
      </div>
    </>
  )
}
