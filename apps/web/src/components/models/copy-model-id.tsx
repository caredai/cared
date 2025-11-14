import { useCallback, useRef, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { splitModelFullId } from '@cared/providers'
import { Button } from '@cared/ui/components/button'

import { copyTextToClipboard } from '@/lib/clipboard'

export function CopyModelId({ modelId: modelFullId }: { modelId: string }) {
  const timeoutHandle = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    await copyTextToClipboard(modelFullId)
    clearTimeout(timeoutHandle.current)
    timeoutHandle.current = setTimeout(() => {
      setCopied(false)
    }, 1000)
    setCopied(true)
  }, [modelFullId])

  const { modelId } = splitModelFullId(modelFullId)

  return (
    <div className="flex items-center text-xs text-muted-foreground">
      <span className="font-mono">{modelId}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={copy}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        <span className="sr-only">Copy Model ID</span>
      </Button>
    </div>
  )
}
