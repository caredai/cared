'use client'

import { useEffect } from 'react'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useClerk,
  UserButton,
} from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'

import { Button } from '@mindworld/ui/components/button'

import { CommandMenu } from '@/components/command-menu'
import { MainNav } from '@/components/main-nav'
import { MobileNav } from '@/components/mobile-nav'
import { ThemeSwitcher } from '@/components/theme'

export function SiteHeader() {
  const clerk = useClerk()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const baseTheme = resolvedTheme === 'dark' ? dark : undefined

    const openSignIn = clerk.openSignIn
    const openSignup = clerk.openSignUp
    const openUserProfile = clerk.openUserProfile

    clerk.openSignIn = (props) => {
      openSignIn({
        appearance: {
          baseTheme,
        },
        ...props,
      })
    }
    clerk.openSignUp = (props) => {
      openSignup({
        appearance: {
          baseTheme,
        },
        ...props,
      })
    }
    clerk.openUserProfile = (props) => {
      openUserProfile({
        appearance: {
          baseTheme,
        },
        ...props,
      })
    }
  }, [clerk, resolvedTheme])

  return (
    <header className="border-grid sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-wrapper">
        <div className="container flex h-14 items-center">
          <MainNav />
          <MobileNav />
          <div className="flex flex-1 items-center justify-between gap-4 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <CommandMenu />
            </div>
            <nav className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline">Sign in</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="max-lg:hidden">Get started</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <ThemeSwitcher />
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
