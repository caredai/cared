import type {
  ConnectedSolanaWallet,
  ConnectedWallet,
  WalletWithMetadata,
} from '@privy-io/react-auth'
import { useMemo } from 'react'
import { useWallets as useEthereumWallets, usePrivy, useSolanaWallets } from '@privy-io/react-auth'

export type Wallet =
  | ConnectedWallet
  | ConnectedSolanaWallet
  | (WalletWithMetadata & {
      linked: true
    })

export function walletType(wallet: Wallet) {
  if ('chainType' in wallet) {
    return wallet.chainType
  } else {
    return wallet.type
  }
}

export function useWallets() {
  const { user } = usePrivy()
  const { wallets: ethereumWallets } = useEthereumWallets()
  const { wallets: solanaWallets } = useSolanaWallets()

  // Apply deduplication to both wallet types
  const deduplicatedEthereumWallets = useMemo(
    () =>
      deduplicateWallets([
        ...ethereumWallets,
        ...(user?.linkedAccounts
          .filter((a): a is WalletWithMetadata => a.type === 'wallet' && a.chainType === 'ethereum')
          .map((a) => ({ ...a, linked: true as const })) ?? []),
      ]),
    [user, ethereumWallets],
  )
  const deduplicatedSolanaWallets = useMemo(
    () =>
      deduplicateWallets([
        ...solanaWallets,
        ...(user?.linkedAccounts
          .filter((a): a is WalletWithMetadata => a.type === 'wallet' && a.chainType === 'solana')
          .map((a) => ({ ...a, linked: true as const })) ?? []),
      ]),
    [user, solanaWallets],
  )

  const allWallets = useMemo(
    () => [...deduplicatedEthereumWallets, ...deduplicatedSolanaWallets],
    [deduplicatedEthereumWallets, deduplicatedSolanaWallets],
  )

  const embeddedWallets = useMemo(
    () => allWallets.filter((wallet) => wallet.walletClientType === 'privy'),
    [allWallets],
  )
  const externalWallets = useMemo(
    () => allWallets.filter((wallet) => wallet.walletClientType !== 'privy'),
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

function deduplicateWallets<T extends Wallet>(wallets: T[]): T[] {
  const seen = new Set<string>()
  return wallets.filter((wallet) => {
    if (seen.has(wallet.address)) {
      return false
    }
    seen.add(wallet.address)
    return true
  })
}
