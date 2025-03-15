import type { User } from '@clerk/nextjs/server'

import { Avatar, AvatarImage } from '@mindworld/ui/components/avatar'

export function UserInfo({ user }: { user: User }) {
  return (
    <>
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={user.imageUrl} alt={user.username ?? ''} />
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.firstName}</span>
        <span className="truncate text-xs">
          {user.username ?? user.emailAddresses[0]?.emailAddress}
        </span>
      </div>
    </>
  )
}
