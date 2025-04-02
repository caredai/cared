'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@tavern/auth/client'

import { Button } from '@ownxai/ui/components/button'

import { useTRPC } from '@/trpc/client'

export function AuthShowcase() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: session } = useQuery(trpc.user.session.queryOptions())

  if (!session?.user) {
    return (
      <Button
        onClick={async () => {
          const r = await authClient.signIn.oauth2({
            providerId: 'ownx',
            callbackURL: '/', // the path to redirect to after the user is authenticated
          })
          console.log(r.data, r.error)
        }}
      >
        Sign in
      </Button>
    )
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
