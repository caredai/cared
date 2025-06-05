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
import type { CharacterGroup} from '@/hooks/use-character-group';
import { useDeleteCharacterGroup } from '@/hooks/use-character-group'
import { isCharacterGroup } from '@/hooks/use-character-or-group'

export function DeleteCharacterOrGroupDialog({
  open,
  onOpenChange,
  charOrGroup,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  charOrGroup: Character | CharacterGroup
  onDelete?: () => void
}) {
  const deleteCharacter = useDeleteCharacter()
  const deleteCharacterGroup = useDeleteCharacterGroup()
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      if (isCharacterGroup(charOrGroup)) {
        await deleteCharacterGroup(charOrGroup.id)
      } else {
        await deleteCharacter(charOrGroup.id)
      }
      onOpenChange(false)
      onDelete?.()
    } finally {
      setIsLoading(false)
    }
  }

  const name = isCharacterGroup(charOrGroup)
    ? charOrGroup.metadata.name
    : charOrGroup.content.data.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Delete {isCharacterGroup(charOrGroup) ? 'character group' : 'character'}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {isCharacterGroup(charOrGroup) ? 'character group' : 'character'} "{name}"? This action cannot be undone.
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
