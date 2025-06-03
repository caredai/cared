import { useState } from 'react'

import { Button } from '@ownxai/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ownxai/ui/components/dialog'

import { CircleSpinner } from '@/components/spinner'
import { useDeleteCharacter } from '@/hooks/use-character'
import type { Character } from '@/hooks/use-character'

export function DeleteCharacterDialog({
  open,
  onOpenChange,
  character,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  character: Character
  onDelete?: () => void
}) {
  const deleteCharacter = useDeleteCharacter(character)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await deleteCharacter()
      onOpenChange(false)
      onDelete?.()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Delete character</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete character "{character.content.data.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
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
