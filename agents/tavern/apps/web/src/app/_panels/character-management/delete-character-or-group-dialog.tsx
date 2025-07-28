import type { Character } from '@/hooks/use-character'
import type { CharacterGroup } from '@/hooks/use-character-group'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cared/ui/components/dialog'

import { CircleSpinner } from '@/components/spinner'
import { useDeleteCharacter } from '@/hooks/use-character'
import { useDeleteCharacterGroup } from '@/hooks/use-character-group'
import { isCharacterGroup } from '@/hooks/use-character-or-group'
import { useSetShowCharacterList } from './hooks'

export function DeleteCharacterOrGroupDialog({
  open,
  onOpenChange,
  trigger,
  charOrGroup,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: ReactNode
  charOrGroup: Character | CharacterGroup
}) {
  const deleteCharacter = useDeleteCharacter()
  const deleteCharacterGroup = useDeleteCharacterGroup()
  const [isLoading, setIsLoading] = useState(false)
  const setShowCharacterList = useSetShowCharacterList()

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      if (isCharacterGroup(charOrGroup)) {
        await deleteCharacterGroup(charOrGroup.id)
      } else {
        await deleteCharacter(charOrGroup.id)
      }
      onOpenChange(false)
      setShowCharacterList()
    } finally {
      setIsLoading(false)
    }
  }

  const name = isCharacterGroup(charOrGroup)
    ? charOrGroup.metadata.name
    : charOrGroup.content.data.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>
            Delete {isCharacterGroup(charOrGroup) ? 'character group' : 'character'}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            {isCharacterGroup(charOrGroup) ? 'character group' : 'character'} "{name}"? This action
            cannot be undone.
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

export function DeleteCharacterDialog({
  trigger,
  character,
}: {
  trigger: ReactNode
  character: Character
}) {
  const [open, setOpen] = useState(false)
  return (
    <DeleteCharacterOrGroupDialog
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      charOrGroup={character}
    />
  )
}
