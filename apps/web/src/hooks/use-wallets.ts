import { useMemo } from 'react'
import { useWallets as useEthereumWallets, usePrivy } from '@privy-io/react-auth'
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana'

import type { ConnectedWallet, WalletWithMetadata } from '@privy-io/react-auth'
import type { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana'

export type Wallet =
  | {
      wallet: ConnectedWallet
      chainType: 'ethereum'
      embedded: boolean
      connected: true
      linked: boolean
    }
  | {
      wallet: ConnectedStandardSolanaWallet
      chainType: 'solana'
      embedded: false
      connected: true
      linked: boolean
    }
  | {
      wallet: WalletWithMetadata
      chainType: 'ethereum' | 'solana'
      embedded: boolean
      connected: false
      linked: true
    }

export function walletType(wallet: Wallet) {
  return wallet.chainType
}

export function useWallets() {
  const { user } = usePrivy()
  const { wallets: ethereumWallets } = useEthereumWallets()
  const { wallets: solanaWallets } = useSolanaWallets()

  // Apply deduplication to both wallet types
  const deduplicatedEthereumWallets = useMemo(
    () =>
      deduplicateWallets([
        ...ethereumWallets.map((w) => ({
          wallet: w,
          chainType: 'ethereum' as const,
          embedded: w.walletClientType === 'privy' || w.walletClientType === 'privy-v2',
          connected: true as const,
          linked: w.linked,
        })),
        ...(user?.linkedAccounts
          .filter((a): a is WalletWithMetadata => a.type === 'wallet' && a.chainType === 'ethereum')
          .map((a) => ({
            wallet: a,
            chainType: 'ethereum' as const,
            embedded: a.walletClientType === 'privy' || a.walletClientType === 'privy-v2',
            connected: false as const,
            linked: true as const,
          })) ?? []),
      ]),
    [user, ethereumWallets],
  )
  const deduplicatedSolanaWallets = useMemo(
    () =>
      deduplicateWallets([
        ...solanaWallets.map((w) => ({
          wallet: w,
          chainType: 'solana' as const,
          embedded: false as const,
          connected: true as const,
          linked: false as const,
        })),
        ...(user?.linkedAccounts
          .filter((a): a is WalletWithMetadata => a.type === 'wallet' && a.chainType === 'solana')
          .map((a) => ({
            wallet: a,
            chainType: 'solana' as const,
            embedded: a.walletClientType === 'privy' || a.walletClientType === 'privy-v2',
            connected: false as const,
            linked: true as const,
          })) ?? []),
      ]),
    [user, solanaWallets],
  )

  const allWallets = useMemo(
    () => [...deduplicatedEthereumWallets, ...deduplicatedSolanaWallets],
    [deduplicatedEthereumWallets, deduplicatedSolanaWallets],
  )

  const embeddedWallets = useMemo(
    () => allWallets.filter((wallet) => wallet.embedded),
    [allWallets],
  )
  const externalWallets = useMemo(
    () => allWallets.filter((wallet) => wallet.embedded),
    [allWallets],
  )

  return {
    ethereumWallets: deduplicatedEthereumWallets,
    solanaWallets: deduplicatedSolanaWallets,
    embeddedWallets,
    externalWallets,
    allWallets,
  }
}

function deduplicateWallets(wallets: Wallet[]): Wallet[] {
  const seen = new Map<string, Wallet>()
  return wallets.filter((w) => {
    const existing = seen.get(w.wallet.address)
    if (existing) {
      if (w.linked && !existing.linked) {
        existing.linked = true
      }
      return false
    }
    seen.set(w.wallet.address, w)
    return true
  })
}
