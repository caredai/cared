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
import { useDeleteCharacters } from '@/hooks/use-characters'

export function DeleteCharactersDialog({
  open,
  onOpenChange,
  selectedCharacterIds,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCharacterIds: string[]
  onDelete: () => void
}) {
  const deleteCharacters = useDeleteCharacters()
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await deleteCharacters(selectedCharacterIds)
      onOpenChange(false)
      onDelete()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete characters</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {selectedCharacterIds.length} selected character
            {selectedCharacterIds.length > 1 ? 's' : ''}? This action cannot be undone.
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
