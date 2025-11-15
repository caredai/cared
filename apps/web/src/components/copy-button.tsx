import type { MouseEvent } from 'react'
import { useCallback, useRef, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@cared/ui/components/button'

import { copyTextToClipboard } from '@/lib/clipboard'

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutHandle = useRef<ReturnType<typeof setTimeout>>(undefined)

  const copy = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      void copyTextToClipboard(value)
      setCopied(true)
      clearTimeout(timeoutHandle.current)
      timeoutHandle.current = setTimeout(() => setCopied(false), 2000)
    },
    [value],
  )

  return (
    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={copy}>
      {copied ? <CheckIcon className="h-3! w-3!" /> : <CopyIcon className="h-3! w-3!" />}
    </Button>
  )
}
