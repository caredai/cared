import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'

import { Button } from '@ownxai/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@ownxai/ui/components/dialog'
import { Input } from '@ownxai/ui/components/input'

import { CircleSpinner } from '@/components/spinner'
import { useLorebook, useUpdateLorebook } from '@/hooks/use-lorebook'
import { useSelectedLorebookId } from './select-lorebook'

interface RenameLorebookDialogProps {
  trigger: ReactNode
}

export function RenameLorebookDialog({ trigger }: RenameLorebookDialogProps) {
  const { selectedLorebookId } = useSelectedLorebookId()
  const { lorebook } = useLorebook(selectedLorebookId ?? '')
  const updateLorebook = useUpdateLorebook()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)
      if (newOpen && lorebook) {
        setName(lorebook.name)
      }
    },
    [lorebook],
  )

  const handleRename = useCallback(() => {
    if (!selectedLorebookId || !lorebook || !name.trim()) return
    setLoading(true)
    try {
      void updateLorebook({
        id: selectedLorebookId,
        name: name.trim(),
      })
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [selectedLorebookId, lorebook, name, updateLorebook])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Rename Lorebook</DialogTitle>
          <DialogDescription>Enter a new name for lorebook "{lorebook?.name}".</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Enter new name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleRename()
              }
            }}
            disabled={loading}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={loading}>
              {loading ? (
                <>
                  <CircleSpinner />
                  Renaming...
                </>
              ) : (
                'Rename'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
