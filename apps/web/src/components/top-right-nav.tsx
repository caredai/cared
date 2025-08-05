'use client'

import { usePrivy } from '@privy-io/react-auth'

import { ThemeSwitcher } from '@/components/theme'
import { WalletInfo } from '@/components/wallet-info'

export function TopRightNav({ showThemeSwitcher }: { showThemeSwitcher?: boolean }) {
  const { ready, authenticated } = usePrivy()

  return (
    <nav className="flex items-center gap-4">
      {ready && authenticated && <WalletInfo />}
      {showThemeSwitcher && <ThemeSwitcher />}
    </nav>
  )
}
