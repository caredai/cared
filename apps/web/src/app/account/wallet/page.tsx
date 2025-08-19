'use client'

import type { Wallet } from '@/hooks/use-wallets'
import { useCallback, useEffect, useState } from 'react'
import * as React from 'react'
import {
  useCreateWallet,
  useFundWallet as useFundEthereumWallet,
  usePrivy,
  useSolanaWallets,
} from '@privy-io/react-auth'
import { useFundWallet as useFundSolanaWallet } from '@privy-io/react-auth/solana'
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
import { useAsync, useCopyToClipboard } from 'react-use'

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

import { SectionTitle } from '@/components/section'
import { CircleSpinner, Spinner } from '@/components/spinner'
import { Tooltip } from '@/components/tooltip'
import { WalletAddress } from '@/components/wallet-address'
import { useWallets, walletType } from '@/hooks/use-wallets'
import { WalletQrDialog } from './wallet-qr-dialog'

export default function WalletPage() {
  const { ready, authenticated, user, linkWallet, unlinkWallet } = usePrivy()

  const { ethereumWallets, solanaWallets, embeddedWallets, externalWallets } = useWallets()

  const { fundWallet: fundSolanaWallet } = useFundSolanaWallet()
  const { fundWallet: fundEthereumWallet } = useFundEthereumWallet()

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

  const addInActionWallet = (address: string) => {
    setInActionWallets((prev) => new Set(prev).add(address))
  }
  const removeInActionWallet = (address: string) => {
    setInActionWallets((prev) => {
      const newSet = new Set(prev)
      newSet.delete(address)
      return newSet
    })
  }

  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)

  const openQrDialog = (wallet: Wallet) => {
    setSelectedWallet(wallet)
    setQrDialogOpen(true)
  }

  const [, copyToClipboard] = useCopyToClipboard()

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

  const handleDisconnectWallet = useCallback(async (wallet: Wallet) => {
    if (wallet.walletClientType === 'privy' || !('isConnected' in wallet)) {
      return
    }

    addInActionWallet(wallet.address)

    try {
      if (await wallet.isConnected()) {
        wallet.disconnect()
      }
    } finally {
      removeInActionWallet(wallet.address)
    }
  }, [])

  const handleLinkWallet = useCallback(async (wallet: Wallet) => {
    if (wallet.walletClientType === 'privy' || !('loginOrLink' in wallet)) {
      return
    }

    addInActionWallet(wallet.address)

    try {
      await wallet.loginOrLink()
    } finally {
      removeInActionWallet(wallet.address)
    }
  }, [])

  const handleUnlinkWallet = useCallback(
    async (wallet: Wallet) => {
      if (wallet.walletClientType === 'privy' || !wallet.linked) {
        return
      }

      addInActionWallet(wallet.address)

      try {
        if ('unlink' in wallet) {
          await wallet.unlink()
        } else {
          await unlinkWallet(wallet.address)
        }
      } finally {
        removeInActionWallet(wallet.address)
      }
    },
    [unlinkWallet],
  )

  const handleFundWallet = useCallback(
    async (wallet: Wallet) => {
      if (walletType(wallet) === 'ethereum') {
        await fundEthereumWallet(wallet.address)
      } else {
        await fundSolanaWallet(wallet.address)
      }
    },
    [fundEthereumWallet, fundSolanaWallet],
  )

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center m-auto">
        <Spinner />
      </div>
    )
  }

  return (
    <>
      <SectionTitle title="Wallet" description="Manage your embedded and external wallets" />

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
                      <p>
                        You can create up to 3 embedded Ethereum wallets and 3 embedded Solana
                        wallets.
                      </p>
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
                  Create
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
                  onFund={() => handleFundWallet(wallet)}
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
                      You can always unlink (and may disconnect) these wallets. For some wallet
                      providers (such as MetaMask, Phantom), you cannot truly disconnect from here.
                      You need to manually disconnect from the DApp connection management page of
                      those wallets.
                    </p>
                  }
                  icon={HelpCircleIcon}
                />
              </CardTitle>
              <CardDescription>Wallets connected from external providers</CardDescription>
            </div>
            <Button onClick={() => linkWallet()}>
              <Link1Icon className="h-4 w-4" />
              Connect
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
                  onLink={() => handleLinkWallet(wallet)}
                  onUnlink={() => handleUnlinkWallet(wallet)}
                  onDisconnect={() => handleDisconnectWallet(wallet)}
                  onFund={() => handleFundWallet(wallet)}
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
    </>
  )
}

function WalletItem({
  wallet,
  copyToClipboard,
  onLink,
  onUnlink,
  onDisconnect,
  onFund,
  isExternal = false,
  inAction = false,
  onOpenQrDialog,
}: {
  wallet: Wallet
  copyToClipboard: (value: string) => void
  onLink?: () => void
  onUnlink?: () => void
  onDisconnect?: () => void
  onFund?: () => void
  isExternal?: boolean
  inAction?: boolean
  onOpenQrDialog?: (wallet: Wallet) => void
}) {
  const isLinked = wallet.linked
  const { value: isConnected } = useAsync(
    async () => 'isConnected' in wallet && (await wallet.isConnected()),
    [wallet],
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-24">
          <Badge variant="secondary">
            {walletType(wallet) === 'ethereum' ? 'Ethereum' : 'Solana'}
          </Badge>
        </div>
        <WalletAddress address={wallet.address} copyToClipboard={copyToClipboard} />
      </div>
      <div className="flex items-center gap-2">
        {isExternal && (
          <>
            {isLinked ? (
              <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600">
                <BadgeCheckIcon />
                Linked
              </Badge>
            ) : (
              <Badge variant="secondary">
                <BadgeAlertIcon />
                Not linked
              </Badge>
            )}
            {isConnected && (
              <Badge variant="secondary" className="bg-green-500 text-white dark:bg-green-600">
                <BadgeCheckIcon />
                Connected
              </Badge>
            )}
            {isConnected === false && (
              <Badge variant="secondary">
                <BadgeAlertIcon />
                Not connected
              </Badge>
            )}
          </>
        )}

        <Button
          variant="secondary"
          size="icon"
          className="size-4"
          onClick={() => onOpenQrDialog?.(wallet)}
        >
          <QrCodeIcon />
        </Button>

        <Button variant="secondary" size="icon" className="size-4" onClick={onFund}>
          <BadgeDollarSignIcon />
        </Button>

        {isExternal && (
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
              {!isLinked ? (
                <DropdownMenuItem className="cursor-pointer" onClick={onLink} disabled={inAction}>
                  Link Wallet
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={onUnlink}
                  disabled={inAction}
                >
                  Unlink Wallet
                </DropdownMenuItem>
              )}
              {isConnected && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={onDisconnect}
                  disabled={inAction}
                >
                  Disconnect Wallet
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
