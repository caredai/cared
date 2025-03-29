'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { usePrivy } from '@privy-io/react-auth'
import { FaWallet } from 'react-icons/fa6'
import { VscDebugDisconnect } from 'react-icons/vsc'

import { Button } from '@ownxai/ui/components/button'

import { ThemeSwitcher } from '@/components/theme'
import { WalletInfo } from '@/components/wallet-info'

export function TopRightNav({ showThemeSwitcher }: { showThemeSwitcher?: boolean }) {
  const { ready, authenticated, login, logout } = usePrivy()

  return (
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
        {ready && authenticated && <WalletInfo />}
      </SignedIn>
      {showThemeSwitcher && <ThemeSwitcher />}
    </nav>
  )
}
