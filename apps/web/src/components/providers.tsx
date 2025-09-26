import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { Provider as JotaiProvider } from 'jotai'
import { useTheme } from 'next-themes'

import { mergeWithoutUndefined } from '@cared/shared'

import type { ImageConfigComplete } from '@/lib/image/image-config'
import type { PrivyClientConfig } from '@privy-io/react-auth'
import { Logo } from '@/components/logo'
import { ThemeProvider } from '@/components/theme'
import { env } from '@/env'
import { usePrivyJwtAuth } from '@/hooks/use-privy'
import { imageConfig } from '@/lib/config'
import { imageConfigDefault } from '@/lib/image/image-config'
import { ImageConfigContext } from '@/lib/image/image-config-context.shared-runtime'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <InnerProviders>{children}</InnerProviders>
    </ThemeProvider>
  )
}

function InnerProviders({ children }: { children: ReactNode }) {
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
    <JotaiProvider>
      <PrivyProvider appId={env.VITE_PRIVY_APP_ID} config={privyConfig}>
        <PrivyJwtAuth />
        <ImageConfigContext.Provider
          // @ts-ignore
          value={mergeWithoutUndefined<ImageConfigComplete>(imageConfigDefault, imageConfig)}
        >
          {children}
        </ImageConfigContext.Provider>
      </PrivyProvider>
    </JotaiProvider>
  )
}

function PrivyJwtAuth() {
  usePrivyJwtAuth()

  return null
}
