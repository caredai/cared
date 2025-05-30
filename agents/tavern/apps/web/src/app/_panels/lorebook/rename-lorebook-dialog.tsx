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
import { useUpdateLorebook } from '@/hooks/use-lorebook'
import { useSelectedLorebook } from './select-lorebook'

export function RenameLorebookDialog({ trigger }: { trigger: ReactNode }) {
  const { selectedLorebook } = useSelectedLorebook()
  const updateLorebook = useUpdateLorebook()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)
      if (newOpen && selectedLorebook) {
        setName(selectedLorebook.name)
      }
    },
    [selectedLorebook],
  )

  const handleRename = useCallback(() => {
    if (!selectedLorebook || !name.trim()) return
    setLoading(true)
    try {
      void updateLorebook({
        id: selectedLorebook.id,
        name: name.trim(),
      })
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [selectedLorebook, name, updateLorebook])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Rename Lorebook</DialogTitle>
          <DialogDescription>
            Enter a new name for lorebook "{selectedLorebook?.name}".
          </DialogDescription>
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
