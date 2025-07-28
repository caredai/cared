'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@tavern/auth/client'

import { Button } from '@cared/ui/components/button'

import { signIn } from '@/lib/sign-in'
import { useTRPC } from '@/trpc/client'

export function AuthShowcase() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: session } = useQuery(trpc.user.session.queryOptions())

  if (!session?.user) {
    return <Button onClick={signIn}>Sign in</Button>
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {session.user.name}</span>
      </p>

      <Button
        onClick={async () => {
          await authClient.signOut()

          void queryClient.invalidateQueries(trpc.user.session.queryOptions())
        }}
      >
        Sign out
      </Button>
    </div>
  )
}
