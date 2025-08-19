'use client'

import { useCallback, useRef, useState } from 'react'
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'

import { Button } from '@cared/ui/components/button'

import { shortenString } from '@/lib/utils'

/**
 * WalletAddress component displays a wallet address with copy functionality
 * @param address - The wallet address to display
 * @param copyToClipboard - Function to copy the address to clipboard
 */
export function WalletAddress({
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
      className="py-1 px-2 h-fit text-muted-foreground font-mono text-xs md:text-sm"
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
