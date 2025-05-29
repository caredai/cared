import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'

import { Button } from '@ownxai/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@ownxai/ui/components/dialog'

import { CircleSpinner } from '@/components/spinner'
import { useDeleteLorebook, useLorebook } from '@/hooks/use-lorebook'
import { useSelectedLorebookId } from './select-lorebook'

interface DeleteLorebookDialogProps {
  trigger: ReactNode
}

export function DeleteLorebookDialog({ trigger }: DeleteLorebookDialogProps) {
  const { selectedLorebookId, setSelectedLorebookId } = useSelectedLorebookId()
  const { lorebook } = useLorebook(selectedLorebookId ?? '')
  const deleteLorebook = useDeleteLorebook()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = useCallback(async () => {
    if (!selectedLorebookId) return
    setLoading(true)
    try {
      await deleteLorebook(selectedLorebookId)
      setSelectedLorebookId(undefined)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [selectedLorebookId, deleteLorebook, setSelectedLorebookId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Delete Lorebook</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete lorebook "{lorebook?.name}"? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? (
              <>
                <CircleSpinner />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
