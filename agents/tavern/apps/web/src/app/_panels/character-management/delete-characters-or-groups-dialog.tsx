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
import { useDeleteCharacters } from '@/hooks/use-character'
import { useCharacterGroups, useDeleteCharacterGroups } from '@/hooks/use-character-group'

export function DeleteCharactersOrGroupsDialog({
  open,
  onOpenChange,
  ids,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ids: string[]
  onDelete: () => void
}) {
  const deleteCharacters = useDeleteCharacters()
  const deleteCharacterGroups = useDeleteCharacterGroups()
  const { groups } = useCharacterGroups()
  const [isLoading, setIsLoading] = useState(false)

  // Split IDs into character IDs and group IDs
  const groupIds = ids.filter((id) => groups.some((group) => group.id === id))
  const characterIds = ids.filter((id) => !groupIds.includes(id))

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const promises = []
      // Delete both characters and groups if they exist
      if (groupIds.length > 0) {
        promises.push(deleteCharacterGroups(groupIds))
      }
      if (characterIds.length > 0) {
        promises.push(deleteCharacters(characterIds))
      }
      await Promise.all(promises)
      onOpenChange(false)
      onDelete()
    } finally {
      setIsLoading(false)
    }
  }

  // Generate description text based on what's being deleted
  const getDescription = () => {
    const parts = []
    if (characterIds.length > 0) {
      parts.push(`${characterIds.length} character${characterIds.length > 1 ? 's' : ''}`)
    }
    if (groupIds.length > 0) {
      parts.push(`${groupIds.length} character group${groupIds.length > 1 ? 's' : ''}`)
    }
    return parts.join(' and ')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Delete items</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {getDescription()}? This action cannot be undone.
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
