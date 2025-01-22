'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { usePrivy } from '@privy-io/react-auth'
import { FaWallet } from 'react-icons/fa6'
import { VscDebugDisconnect } from 'react-icons/vsc'

import { Button } from '@mindworld/ui/components/button'

import { CommandMenu } from '@/components/command-menu'
import { MainNav } from '@/components/main-nav'
import { MobileNav } from '@/components/mobile-nav'
import { ThemeSwitcher } from '@/components/theme'
import { WalletInfo } from '@/components/wallet-info'

export function SiteHeader() {
  const { ready, authenticated, login, logout } = usePrivy()

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
                <UserButton>
                  {ready && (
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label={!authenticated ? 'Connect wallet' : 'Disconnect wallet'}
                        labelIcon={
                          <div className="flex justify-center items-center h-full">
                            <VscDebugDisconnect size="1rem" />
                          </div>
                        }
                        onClick={!authenticated ? login : logout}
                      />
                    </UserButton.MenuItems>
                  )}
                  <UserButton.UserProfilePage
                    label="Wallet"
                    url="wallet"
                    labelIcon={
                      <div className="flex justify-center items-center h-full">
                        <FaWallet />
                      </div>
                    }
                  >
                    haha
                  </UserButton.UserProfilePage>
                </UserButton>
                {ready && !authenticated && <Button onClick={login}>Connect wallet</Button>}
              </SignedIn>
              {ready && authenticated && <WalletInfo />}
              <ThemeSwitcher />
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
