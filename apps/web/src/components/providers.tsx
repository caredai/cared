'use client'

import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { useTheme } from 'next-themes'

import { Logo } from '@/components/logo'
import { ThemeProvider } from '@/components/theme'
import { env } from '@/env'
import { TRPCReactProvider } from '@/trpc/client'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <InnerProviders>{children}</InnerProviders>
    </ThemeProvider>
  )
}

function InnerProviders({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()

  const solanaConnectors = toSolanaWalletConnectors({
    shouldAutoConnect: true,
  })

  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
      }}
    >
      <TRPCReactProvider>
        <PrivyProvider
          appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
          config={{
            appearance: {
              theme: resolvedTheme === 'dark' ? 'dark' : 'light',
              accentColor: '#676FFF',
              logo: <Logo />,
              landingHeader: 'Connect wallet',
              walletChainType: 'ethereum-and-solana',
              walletList: [
                'phantom',
                'metamask',
                'okx_wallet',
                'wallet_connect',
                'coinbase_wallet',
                'uniswap',
                'rainbow',
                'zerion',
                'rabby_wallet',
                'safe',
              ],
            },
            loginMethods: ['wallet'],
            walletConnectCloudProjectId: env.NEXT_PUBLIC_REOWN_PROJECT_ID,
            externalWallets: {
              solana: {
                connectors: solanaConnectors,
              },
              coinbaseWallet: {
                connectionOptions: 'all',
              },
            },
          }}
        >
          {children}
        </PrivyProvider>
      </TRPCReactProvider>
    </ClerkProvider>
  )
}
