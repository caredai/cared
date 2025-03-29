'use client'

import type { OAuthStrategy } from '@clerk/types'
import { useSignIn } from '@clerk/nextjs'

import { Button } from '@ownxai/ui/components/button'

export function SignInButton() {
  const { signIn } = useSignIn()

  if (!signIn) return null

  const signInWith = (strategy: OAuthStrategy) => {
    return signIn
      .authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      })
      .then((res) => {
        console.log(res)
      })
      .catch((err: any) => {
        // See https://clerk.com/docs/custom-flows/error-handling
        // for more info on error handling
        console.log(err.errors)
        console.error(err, null, 2)
      })
  }

  return (
    <Button size="lg" onClick={() => signInWith('oauth_custom_mind')}>
      Sign in with Mind
    </Button>
  )
}
