import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { useTheme } from 'next-themes'

import type { PrivyClientConfig } from '@privy-io/react-auth'
import { Logo } from '@/components/logo'
import { env } from '@/env'
import { usePrivyJwtAuth } from '@/hooks/use-privy'

export function ClientPrivyProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()

  const privyConfig = useMemo(() => {
    return {
      appearance: {
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
        accentColor: '#676FFF',
        logo: <Logo />,
        walletChainType: 'ethereum-and-solana',
        walletList: [
          'phantom',
          'metamask',
          'okx_wallet',
          'wallet_connect',
          'coinbase_wallet',
          'binance',
          'uniswap',
          'rainbow',
          'zerion',
          'rabby_wallet',
          'safe',
          'backpack',
        ],
        showWalletLoginFirst: true,
      },
      loginMethods: ['wallet'], // NOTE: just a placeholder to avoid the "You must enable at least one login method" error
      walletConnectCloudProjectId: env.VITE_REOWN_PROJECT_ID,
      externalWallets: {
        solana: {
          connectors: toSolanaWalletConnectors({
            shouldAutoConnect: true,
          }),
        },
        coinbaseWallet: {
          connectionOptions: 'all',
        },
      },
      embeddedWallets: {
        ethereum: {
          createOnLogin: 'all-users',
        },
        solana: {
          createOnLogin: 'all-users',
        },
        extendedCalldataDecoding: true,
      },
    } as PrivyClientConfig
  }, [resolvedTheme])

  return (
    <PrivyProvider appId={env.VITE_PRIVY_APP_ID} config={privyConfig}>
      <PrivyJwtAuth />
      {children}
    </PrivyProvider>
  )
}

function PrivyJwtAuth() {
  usePrivyJwtAuth()

  return null
}
