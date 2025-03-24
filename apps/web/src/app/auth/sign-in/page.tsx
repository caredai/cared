'use client'

import type { Provider } from '@/lib/auth-providers'
import * as React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'

import { authClient } from '@mindworld/auth/client'
import { Button } from '@mindworld/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mindworld/ui/components/card'
import { Separator } from '@mindworld/ui/components/separator'

import { CircleSpinner } from '@/components/spinner'
import { allowedProviders } from '@/lib/auth-providers'

/**
 * Sign-in page component with social login options
 */
export default function Page() {
  const [isLoading, setIsLoading] = useState<string>()

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const getRedirectTo = new URLSearchParams(globalThis.location?.search).get('redirectTo') ?? '/'

  /**
   * Handles social provider authentication
   * @param provider - The social provider to authenticate with
   */
  const handleSocialSignIn = async (provider: Provider) => {
    setIsLoading(provider)
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: getRedirectTo,
    })
    if (error) {
      toast.error(error.message ?? error.statusText)
      setIsLoading(undefined)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-sm">
        <Card className="border-1 shadow-lg rounded-3xl gap-2">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-2xl">🎉 Sign in to Mind</CardTitle>
            <CardDescription className="text-lg">
              Welcome back! Please sign in to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6">
            <div className="grid gap-4">
              {allowedProviders.map(({ icon: Icon, name, provider }) => {
                return (
                  <Button
                    key={provider}
                    variant="outline"
                    size="lg"
                    className={`flex items-center justify-center gap-3 h-12 transition-all duration-300 rounded-2xl`}
                    disabled={!!isLoading}
                    onClick={() => handleSocialSignIn(provider)}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      {isLoading === provider ? (
                        <CircleSpinner className="text-muted-foreground" />
                      ) : (
                        <Icon color />
                      )}
                    </div>
                    <span className="font-normal text-base">{name}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Separator className="my-6" />
            <p className="text-center text-sm text-muted-foreground">Secured by Mind 🛡️</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
