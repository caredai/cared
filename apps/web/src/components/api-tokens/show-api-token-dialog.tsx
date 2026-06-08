import { useCallback } from 'react'
import { atom, useAtom } from 'jotai'

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

import { CopyButton } from '@/components/copy-button'

// Atom to store the API token dialog state
export const apiTokenDialogAtom = atom<{
  open: boolean
  token: string | null
}>({
  open: false,
  token: null,
})

export function useShowApiTokenDialog() {
  const [apiTokenDialogState, setApiTokenDialogState] = useAtom(apiTokenDialogAtom)
  return {
    apiTokenDialogState,
    showApiTokenDialog: useCallback(
      (token: string) => {
        setApiTokenDialogState({
          open: true,
          token,
        })
      },
      [setApiTokenDialogState],
    ),
    closeApiTokenDialog: useCallback(() => {
      setApiTokenDialogState({
        open: false,
        token: null,
      })
    }, [setApiTokenDialogState]),
  }
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

  return (
    <Dialog open={apiTokenDialogState.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API Token</DialogTitle>
          <DialogDescription>
            This is your new API token. Make sure to copy it now. You won&apos;t be able to see it
            again!
          </DialogDescription>
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
