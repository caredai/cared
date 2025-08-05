'use client'

import type { ConnectedSolanaWallet, ConnectedWallet } from '@privy-io/react-auth'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePrivy, useSolanaWallets, useWallets } from '@privy-io/react-auth'
import { CheckIcon, CopyIcon, Link1Icon, PlusIcon } from '@radix-ui/react-icons'
import { EllipsisVertical } from 'lucide-react'
import { useCopyToClipboard } from 'react-use'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'

import { CircleSpinner } from '@/components/spinner'
import { shortenString } from '@/lib/utils'

export default function WalletPage() {
  const { ready, authenticated, user, createWallet, linkWallet } = usePrivy()

  const { wallets: ethereumWallets } = useWallets()
  const { wallets: solanaWallets } = useSolanaWallets()

  // State to track which wallet is being disconnected
  const [disconnectingWallet, setDisconnectingWallet] = useState<string | null>(null)

  // Separate embedded and external wallets
  const embeddedWallets = [...ethereumWallets, ...solanaWallets].filter(
    (wallet) => wallet.walletClientType === 'privy',
  )
  const externalWallets = [...ethereumWallets, ...solanaWallets].filter(
    (wallet) => wallet.walletClientType !== 'privy',
  )

  useEffect(() => {
    console.log('User:', user)
    console.log('Ethereum wallets:', ethereumWallets)
    console.log('Solana wallets:', solanaWallets)
    console.log('Embedded wallets:', embeddedWallets)
    console.log('External wallets:', externalWallets)
  }, [user, ethereumWallets, solanaWallets, embeddedWallets, externalWallets])

  const [, copyToClipboard] = useCopyToClipboard()

  // Handle disconnecting external wallet
  const handleDisconnectWallet = useCallback(
    async (wallet: ConnectedWallet | ConnectedSolanaWallet) => {
      if (wallet.walletClientType === 'privy') {
        return
      }

      setDisconnectingWallet(wallet.address)

      try {
        if (wallet.linked) {
          await wallet.unlink()
        }
        if (await wallet.isConnected()) {
          wallet.disconnect()
        }
      } catch (error) {
        console.error('Error disconnecting wallet:', error)
      } finally {
        setDisconnectingWallet(null)
      }
    },
    [],
  )

  if (!ready || !authenticated) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Wallet Management</h1>
        <p className="text-muted-foreground mt-2">Manage your embedded and external wallets</p>
      </div>

      {/* Embedded Wallets Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Embedded Wallets</CardTitle>
              <CardDescription>Wallets created and managed by Privy</CardDescription>
            </div>
            <Button onClick={() => createWallet()} className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Create Wallet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {embeddedWallets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No embedded wallets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {embeddedWallets.map((wallet) => (
                <WalletItem
                  key={wallet.address}
                  wallet={wallet}
                  copyToClipboard={copyToClipboard}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* External Wallets Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>External Wallets</CardTitle>
              <CardDescription>Wallets connected from external providers</CardDescription>
            </div>
            <Button onClick={() => linkWallet()} className="flex items-center gap-2">
              <Link1Icon className="h-4 w-4" />
              Link Wallet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {externalWallets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No external wallets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {externalWallets.map((wallet) => (
                <WalletItem
                  key={wallet.address}
                  wallet={wallet}
                  copyToClipboard={copyToClipboard}
                  onDisconnect={() => handleDisconnectWallet(wallet)}
                  isExternal={true}
                  inAction={disconnectingWallet === wallet.address}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function WalletItem({
  wallet,
  copyToClipboard,
  onDisconnect,
  isExternal = false,
  inAction = false,
}: {
  wallet: ConnectedWallet | ConnectedSolanaWallet
  copyToClipboard: (value: string) => void
  onDisconnect?: () => void
  isExternal?: boolean
  inAction?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-2 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-24">
          <Badge variant="secondary">{wallet.type === 'ethereum' ? 'Ethereum' : 'Solana'}</Badge>
        </div>
        <WalletAddress address={wallet.address} copyToClipboard={copyToClipboard} />
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {wallet.walletClientType === 'privy' ? 'Embedded' : 'External'}
        </Badge>
        {isExternal && onDisconnect && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {inAction ? (
                  <CircleSpinner className="h-4 w-4" />
                ) : (
                  <EllipsisVertical className="h-4 w-4" />
                )}
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={onDisconnect}
                className="text-destructive"
                disabled={inAction}
              >
                {inAction ? 'Disconnecting...' : 'Disconnect Wallet'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

function WalletAddress({
  address,
  copyToClipboard,
}: {
  address: string
  copyToClipboard: (value: string) => void
}) {
  const timeoutHandle = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    copyToClipboard(address)
    clearTimeout(timeoutHandle.current)
    timeoutHandle.current = setTimeout(() => {
      setCopied(false)
    }, 1000)
    setCopied(true)
  }, [address, copyToClipboard, setCopied])

  return (
    <Button
      className="py-1 px-2 h-fit text-muted-foreground font-mono"
      variant="outline"
      onClick={copy}
    >
      <span>
        {shortenString(address, {
          prefixChars: 4,
          suffixChars: 6,
        })}
      </span>
      {copied ? <CheckIcon className="ml-2 h-3 w-3" /> : <CopyIcon className="ml-2 h-3 w-3" />}
    </Button>
  )
}
