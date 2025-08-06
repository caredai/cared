import type { ConnectedSolanaWallet, ConnectedWallet } from '@privy-io/react-auth'
import { useMemo } from 'react'
import { useWallets as useEthereumWallets, useSolanaWallets } from '@privy-io/react-auth'

export function useWallets() {
  const { wallets: ethereumWallets } = useEthereumWallets()
  const { wallets: solanaWallets } = useSolanaWallets()

  // Apply deduplication to both wallet types
  const deduplicatedEthereumWallets = useMemo(
    () => deduplicateWallets(ethereumWallets),
    [ethereumWallets],
  )
  const deduplicatedSolanaWallets = useMemo(
    () => deduplicateWallets(solanaWallets),
    [solanaWallets],
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

function deduplicateWallets<T extends ConnectedWallet | ConnectedSolanaWallet>(wallets: T[]): T[] {
  const seen = new Set<string>()
  return wallets.filter((wallet) => {
    if (seen.has(wallet.address)) {
      return false
    }
    seen.add(wallet.address)
    return true
  })
}
