import { SignOutButton } from '@clerk/nextjs'
import { clerkClient, currentUser } from '@clerk/nextjs/server'

import { Button } from '@ownxai/ui/components/button'

import { SignInButton } from '@/components/SignInButton'

export async function AuthShowcase() {
  const user = await currentUser()

  if (!user) {
    return <SignInButton />
  }

  const client = await clerkClient()
  const { data } = await client.users.getUserOauthAccessToken(user.id, 'oauth_custom_mind')
  data.forEach((token) => {
    console.log(token)
  })

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {user.firstName}</span>
      </p>

      <SignOutButton>
        <Button>sign out</Button>
      </SignOutButton>
    </div>
  )
}
