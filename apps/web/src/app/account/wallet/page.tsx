'use client'

import type { ConnectedSolanaWallet, ConnectedWallet } from '@privy-io/react-auth'
import { useCallback, useEffect, useState } from 'react'
import * as React from 'react'
import { useCreateWallet, usePrivy, useSolanaWallets } from '@privy-io/react-auth'
import { Link1Icon, PlusIcon } from '@radix-ui/react-icons'
import {
  BadgeAlertIcon,
  BadgeCheckIcon,
  BadgeDollarSignIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  HelpCircleIcon,
  QrCodeIcon,
} from 'lucide-react'
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
import { Tooltip } from '@/components/tooltip'
import { WalletAddress } from '@/components/wallet-address'
import { useWallets } from '@/hooks/use-wallets'
import { WalletQrDialog } from './wallet-qr-dialog'

export default function WalletPage() {
  const { ready, authenticated, user, linkWallet } = usePrivy()

  const { ethereumWallets, solanaWallets, embeddedWallets, externalWallets } = useWallets()

  useEffect(() => {
    console.log('User:', user)
    console.log('Ethereum wallets:', ethereumWallets)
    console.log('Solana wallets:', solanaWallets)
    console.log('Embedded wallets:', embeddedWallets)
    console.log('External wallets:', externalWallets)
  }, [user, ethereumWallets, solanaWallets, embeddedWallets, externalWallets])

  const { createWallet: createEthereumWallet } = useCreateWallet()
  const { createWallet: createSolanaWallet } = useSolanaWallets()

  const [inActionWallets, setInActionWallets] = useState<Set<string>>(new Set())
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)

  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<
    ConnectedWallet | ConnectedSolanaWallet | null
  >(null)

  const openQrDialog = (wallet: ConnectedWallet | ConnectedSolanaWallet) => {
    setSelectedWallet(wallet)
    setQrDialogOpen(true)
  }

  const [, copyToClipboard] = useCopyToClipboard()

  // Handle creating Ethereum wallet
  const handleCreateEthereumWallet = useCallback(async () => {
    setIsCreatingWallet(true)
    try {
      await createEthereumWallet({
        createAdditional: !!ethereumWallets.length,
      })
    } catch (error) {
      console.error('Error creating Ethereum wallet:', error)
    } finally {
      setIsCreatingWallet(false)
    }
  }, [createEthereumWallet, ethereumWallets.length])

  // Handle creating Solana wallet
  const handleCreateSolanaWallet = useCallback(async () => {
    setIsCreatingWallet(true)
    try {
      await createSolanaWallet({
        createAdditional: !!solanaWallets.length,
      })
    } catch (error) {
      console.error('Error creating Solana wallet:', error)
    } finally {
      setIsCreatingWallet(false)
    }
  }, [createSolanaWallet, solanaWallets.length])

  // Handle disconnecting external wallet
  const handleDisconnectWallet = useCallback(
    async (wallet: ConnectedWallet | ConnectedSolanaWallet) => {
      if (wallet.walletClientType === 'privy') {
        return
      }

      // Add wallet address to inActionWallets set
      setInActionWallets((prev) => new Set(prev).add(wallet.address))

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
        // Remove wallet address from inActionWallets set
        setInActionWallets((prev) => {
          const newSet = new Set(prev)
          newSet.delete(wallet.address)
          return newSet
        })
      }
    },
    [],
  )

  // Handle linking external wallet
  const handleLinkWallet = useCallback(async (wallet: ConnectedWallet | ConnectedSolanaWallet) => {
    if (wallet.walletClientType === 'privy') {
      return
    }

    // Add wallet address to inActionWallets set
    setInActionWallets((prev) => new Set(prev).add(wallet.address))

    try {
      await wallet.loginOrLink()
    } catch (error) {
      console.error('Error linking wallet:', error)
    } finally {
      // Remove wallet address from inActionWallets set
      setInActionWallets((prev) => {
        const newSet = new Set(prev)
        newSet.delete(wallet.address)
        return newSet
      })
    }
  }, [])

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
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Wallet Management</h1>
        <p className="text-gray-600">Manage your embedded and external wallets</p>
      </div>

      {/* Embedded Wallets Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>
                Embedded Wallets &nbsp;
                <Tooltip
                  className="inline-block align-bottom"
                  content={
                    <>
                      <p>
                        Embedded wallets are powered by Privy, utilizing globally distributed
                        infrastructure for high uptime and low latency. They leverage secure
                        hardware (TEE) to ensure only you can control your wallets.
                      </p>
                      <br />
                      <p>You can create up to 3 Ethereum wallets and 3 Solana wallets.</p>
                    </>
                  }
                  icon={HelpCircleIcon}
                />
              </CardTitle>
              <CardDescription>Wallets created and managed by Cared</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isCreatingWallet}>
                  {isCreatingWallet ? (
                    <CircleSpinner className="h-4 w-4" />
                  ) : (
                    <PlusIcon className="h-4 w-4" />
                  )}
                  Create Wallet
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleCreateEthereumWallet}
                  disabled={
                    isCreatingWallet ||
                    embeddedWallets.filter((w) => w.type === 'ethereum').length >= 3
                  }
                >
                  <div className="flex items-center gap-2">Ethereum</div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleCreateSolanaWallet}
                  disabled={
                    isCreatingWallet ||
                    embeddedWallets.filter((w) => w.type === 'solana').length >= 3
                  }
                >
                  <div className="flex items-center gap-2">Solana</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  onOpenQrDialog={openQrDialog}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* External Wallets Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>
                External Wallets &nbsp;
                <Tooltip
                  className="inline-block align-bottom"
                  content={
                    <p>
                      Connected & linked wallets from external wallet providers.
                      <br />
                      <br />
                      "Linked" means the wallet has completed signature verification, providing
                      stronger proof of ownership than just "connected".
                      <br />
                      <br />
                      You can always unlink (and may disconnect) these wallets. For some wallet providers (such as MetaMask, Phantom), you cannot truly
                      disconnect from here. You need to manually disconnect from the DApp connection
                      management page of those wallets.
                    </p>
                  }
                  icon={HelpCircleIcon}
                />
              </CardTitle>
              <CardDescription>Wallets connected from external providers</CardDescription>
            </div>
            <Button onClick={() => linkWallet()}>
              <Link1Icon className="h-4 w-4" />
              Connect Wallet
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
                  onLink={() => handleLinkWallet(wallet)}
                  isExternal={true}
                  onOpenQrDialog={openQrDialog}
                  inAction={inActionWallets.has(wallet.address)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <WalletQrDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        selectedWallet={selectedWallet}
        copyToClipboard={copyToClipboard}
      />
    </div>
  )
}

function WalletItem({
  wallet,
  copyToClipboard,
  onDisconnect,
  onLink,
  isExternal = false,
  inAction = false,
  onOpenQrDialog,
}: {
  wallet: ConnectedWallet | ConnectedSolanaWallet
  copyToClipboard: (value: string) => void
  onDisconnect?: () => void
  onLink?: () => void
  isExternal?: boolean
  inAction?: boolean
  onOpenQrDialog?: (wallet: ConnectedWallet | ConnectedSolanaWallet) => void
}) {
  // Check if wallet is connected but not linked
  const isConnectedButNotLinked = isExternal && !wallet.linked

  return (
    <div className="flex flex-wrap items-center justify-end md:justify-between gap-2 p-2 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-24">
          <Badge variant="secondary">{wallet.type === 'ethereum' ? 'Ethereum' : 'Solana'}</Badge>
        </div>
        <WalletAddress address={wallet.address} copyToClipboard={copyToClipboard} />
      </div>
      <div className="flex items-center gap-2">
        {isConnectedButNotLinked && (
          <Badge variant="secondary" className="bg-yellow-500 text-white dark:bg-yellow-600">
            <BadgeAlertIcon />
            Connected
          </Badge>
        )}
        {isExternal && wallet.linked && (
          <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600">
            <BadgeCheckIcon />
            Linked
          </Badge>
        )}
        <Button
          variant="secondary"
          size="icon"
          className="size-4"
          onClick={() => onOpenQrDialog?.(wallet)}
        >
          <QrCodeIcon />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="size-4"
          onClick={() => wallet.fund()}
        >
          <BadgeDollarSignIcon />
        </Button>
        {isExternal && (onDisconnect ?? onLink) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={inAction}>
                {inAction ? (
                  <CircleSpinner className="h-4 w-4" />
                ) : (
                  <EllipsisVerticalIcon className="h-4 w-4" />
                )}
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isConnectedButNotLinked && onLink && (
                <DropdownMenuItem className="cursor-pointer" onClick={onLink} disabled={inAction}>
                  {inAction ? 'Linking...' : 'Link Wallet'}
                </DropdownMenuItem>
              )}
              {onDisconnect && (
                <DropdownMenuItem
                  onClick={onDisconnect}
                  className="text-destructive focus:text-destructive cursor-pointer"
                  disabled={inAction}
                >
                  {inAction ? 'Disconnecting...' : 'Disconnect Wallet'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
