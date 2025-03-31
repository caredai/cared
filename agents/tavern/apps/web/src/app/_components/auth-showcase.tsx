'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { authClient } from '@tavern/auth/client'

import { Button } from '@ownxai/ui/components/button'

import { useTRPC } from '@/trpc/client'

export function AuthShowcase() {
  const trpc = useTRPC()
  const {
    data: { user },
  } = useSuspenseQuery(trpc.user.me.queryOptions())

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {user.name}</span>
      </p>

      <Button
        onClick={() => {
          void authClient.signOut()
        }}
      >
        Sign out
      </Button>
    </div>
  )
}
