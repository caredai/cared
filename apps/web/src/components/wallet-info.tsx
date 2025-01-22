'use client'

import type { ConnectedSolanaWallet, ConnectedWallet } from '@privy-io/react-auth'
import { useEffect } from 'react'
import { usePrivy, useSolanaWallets, useWallets } from '@privy-io/react-auth'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'
import { useCopyToClipboard, useTimeout } from 'react-use'

import { Button } from '@mindworld/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mindworld/ui/components/dialog'
import { Label } from '@mindworld/ui/components/label'
import { Separator } from '@mindworld/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@mindworld/ui/components/tooltip'

import { shortenString } from '@/lib/utils'

export function WalletInfo() {
  const { ready, authenticated, user } = usePrivy()

  const { wallets: ethereumWallets } = useWallets()
  const { wallets: solanaWallets } = useSolanaWallets()

  useEffect(() => {
    console.log(user)
    console.log('Ethereum wallets:', ethereumWallets)
    console.log('Solana wallets:', solanaWallets)
  }, [user, ethereumWallets, solanaWallets])

  const [, copyToClipboard] = useCopyToClipboard()

  if (!ready || !authenticated || !user?.wallet) {
    return <></>
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="font-mono">
          {shortenString(user.wallet.address, {
            prefixChars: 4,
            suffixChars: 6,
          })}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-full h-full">
        <DialogHeader>
          <DialogTitle>Wallet</DialogTitle>
          <DialogDescription>View and manage your wallet.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-left">Main wallet:</Label>
          <p>{user.wallet.chainType === 'ethereum' ? 'Ethereum' : 'Solana'}</p>
          <div className="col-span-2">
            <AddressTooltip address={user.wallet.address} copyToClipboard={copyToClipboard} />
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 items-center gap-4">
          <Label className="text-left">Ephemeral wallets:</Label>
          {solanaWallets.map((wallet) => (
            <WalletItem key={wallet.address} wallet={wallet} copyToClipboard={copyToClipboard} />
          ))}
          {ethereumWallets.map((wallet) => (
            <WalletItem key={wallet.address} wallet={wallet} copyToClipboard={copyToClipboard} />
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WalletItem({
  wallet,
  copyToClipboard,
}: {
  wallet: ConnectedWallet | ConnectedSolanaWallet
  copyToClipboard: (value: string) => void
}) {
  return (
    <>
      <p>{wallet.type === 'ethereum' ? 'Ethereum' : 'Solana'}</p>
      <div className="col-span-2">
        <AddressTooltip address={wallet.address} copyToClipboard={copyToClipboard} />
      </div>
    </>
  )
}

function AddressTooltip({
  address,
  copyToClipboard,
}: {
  address: string
  copyToClipboard: (value: string) => void
}) {
  const [isReady, cancel, reset] = useTimeout(3000)
  useEffect(() => {
    cancel()
  }, [cancel])

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="py-1 px-2 h-fit text-muted-foreground"
            variant="outline"
            onClick={() => {
              copyToClipboard(address)
              reset()
            }}
          >
            {isReady() === false ? <CheckIcon /> : isReady() === true && <CopyIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono">
            {shortenString(address, {
              prefixChars: 4,
              suffixChars: 6,
            })}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
