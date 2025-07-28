'use client'

import type { PrivyClientConfig } from '@privy-io/react-auth'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { Provider as JotaiProvider } from 'jotai'
import { useTheme } from 'next-themes'

import { authClient } from '@cared/auth/client'

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
  const router = useRouter()
  const { resolvedTheme } = useTheme()

  const privyConfig = useMemo(() => {
    return {
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
          connectors: toSolanaWalletConnectors({
            shouldAutoConnect: true,
          }),
        },
        coinbaseWallet: {
          connectionOptions: 'all',
        },
      },
    } as PrivyClientConfig
  }, [resolvedTheme])

  return (
    <AuthUIProvider
      // @ts-ignore
      authClient={authClient}
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      navigate={router.push}
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      LinkComponent={Link}
      signUp={false}
      credentials={false}
      providers={['google', 'twitter', 'discord', 'github']}
    >
      <TRPCReactProvider>
        <JotaiProvider>
          <PrivyProvider appId={env.NEXT_PUBLIC_PRIVY_APP_ID} config={privyConfig}>
            {children}
          </PrivyProvider>
        </JotaiProvider>
      </TRPCReactProvider>
    </AuthUIProvider>
  )
}
