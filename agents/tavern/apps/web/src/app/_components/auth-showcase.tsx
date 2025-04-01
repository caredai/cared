'use client'

import { authClient } from '@tavern/auth/client'

import { Button } from '@ownxai/ui/components/button'

export function AuthShowcase({ session }: { session?: typeof authClient.$Infer.Session }) {
  if (!session?.user) {
    return (
      <Button
        onClick={() => {
          void authClient.signIn.oauth2({
            providerId: 'ownx',
            callbackURL: '/', // the path to redirect to after the user is authenticated
          })
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
        onClick={() => {
          void authClient.signOut()
        }}
      >
        Sign out
      </Button>
    </div>
  )
}
