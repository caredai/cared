'use client'

import type { ConnectedSolanaWallet, ConnectedWallet } from '@privy-io/react-auth'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePrivy, useSolanaWallets, useWallets } from '@privy-io/react-auth'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'
import { useCopyToClipboard } from 'react-use'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cared/ui/components/dialog'
import { Label } from '@cared/ui/components/label'
import { Separator } from '@cared/ui/components/separator'

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
      <DialogContent
        className="sm:max-w-[660px]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Wallet</DialogTitle>
          <DialogDescription>View and manage your wallet.</DialogDescription>
        </DialogHeader>
        <div className="py-8 flex flex-col gap-8">
          <div className="grid grid-cols-5 items-center gap-8">
            <Label className="col-span-2">Main wallet:</Label>
            <Badge variant="secondary" className="col-start-3 w-fit">
              {user.wallet.chainType === 'ethereum' ? 'Ethereum' : 'Solana'}
            </Badge>
            <div className="col-span-2 flex justify-center">
              <WalletAddress address={user.wallet.address} copyToClipboard={copyToClipboard} />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-5 items-center gap-8">
            <Label className="col-span-2">Ephemeral wallets:</Label>
            {solanaWallets.map((wallet) => (
              <WalletItem key={wallet.address} wallet={wallet} copyToClipboard={copyToClipboard} />
            ))}
            {ethereumWallets.map((wallet) => (
              <WalletItem key={wallet.address} wallet={wallet} copyToClipboard={copyToClipboard} />
            ))}
          </div>
        </div>
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
      <Badge variant="secondary" className="col-start-3 w-fit">
        {wallet.type === 'ethereum' ? 'Ethereum' : 'Solana'}
      </Badge>
      <div className="col-span-2 flex justify-center">
        <WalletAddress address={wallet.address} copyToClipboard={copyToClipboard} />
      </div>
    </>
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
    <Button className="py-1 px-2 h-fit text-muted-foreground" variant="outline" onClick={copy}>
      <p className="font-mono">
        {shortenString(address, {
          prefixChars: 4,
          suffixChars: 6,
        })}
      </p>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}
