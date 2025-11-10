'use client'

import { useCallback, useState } from 'react'
import { atom, useAtom } from 'jotai'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import { Input } from '@cared/ui/components/input'

// Atom to store the API token dialog state
export const apiTokenDialogAtom = atom<{
  open: boolean
  token: string | null
  type: 'api-token' | 'ai-api-key'
}>({
  open: false,
  token: null,
  type: 'api-token',
})

export function useShowApiTokenDialog() {
  const [apiTokenDialogState, setApiTokenDialogState] = useAtom(apiTokenDialogAtom)
  return {
    apiTokenDialogState,
    showApiTokenDialog: useCallback(
      (token: string, type: 'api-token' | 'ai-api-key' = 'api-token') => {
        setApiTokenDialogState({
          open: true,
          token,
          type,
        })
      },
      [setApiTokenDialogState],
    ),
    closeApiTokenDialog: useCallback(() => {
      setApiTokenDialogState({
        open: false,
        token: null,
        type: 'api-token',
      })
    }, [setApiTokenDialogState]),
  }
}

// Copy button component for copying API key
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  return (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={copy}>
      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
    </Button>
  )
}

// Shared API Token Dialog component
export function ApiTokenDialog() {
  const { apiTokenDialogState, closeApiTokenDialog } = useShowApiTokenDialog()

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeApiTokenDialog()
      }
    },
    [closeApiTokenDialog],
  )

  const isAiApiKey = apiTokenDialogState.type === 'ai-api-key'
  const title = isAiApiKey ? 'AI API Key' : 'API Token'
  const description = isAiApiKey
    ? "This is your new AI API key. Make sure to copy it now. You won't be able to see it again!"
    : "This is your new API token. Make sure to copy it now. You won't be able to see it again!"

  return (
    <Dialog open={apiTokenDialogState.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input value={apiTokenDialogState.token ?? ''} readOnly className="font-mono" />
          <CopyButton value={apiTokenDialogState.token ?? ''} />
        </div>
        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
