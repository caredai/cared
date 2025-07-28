import type { Character } from '@/hooks/use-character'
import { useEffect, useState } from 'react'

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
import { Input } from '@cared/ui/components/input'

import { CircleSpinner } from '@/components/spinner'
import { useCreateCharacter } from '@/hooks/use-character'
import { useSetActiveCharacterOrGroup } from '@/hooks/use-character-or-group'

export function DuplicateCharacterDialog({
  trigger,
  character,
}: {
  trigger: React.ReactNode
  character: Character
}) {
  const [open, setOpen] = useState(false)
  const [newCharacterName, setNewCharacterName] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  const createCharacter = useCreateCharacter()
  const setActiveCharacterOrGroup = useSetActiveCharacterOrGroup()

  // Reset form when the dialog opens
  useEffect(() => {
    if (open) {
      setNewCharacterName(character.content.data.name)
    }
  }, [open, character])

  const handleDuplicate = async () => {
    if (!newCharacterName.trim()) {
      return
    }

    setIsDuplicating(true)
    try {
      // Create a deep copy of the character content and update the name
      const duplicatedContent = {
        ...character.content,
        data: {
          ...character.content.data,
          name: newCharacterName.trim(),
        },
      }

      // Fetch the character image and convert to data URL
      const imageResponse = await fetch(character.metadata.url)
      const imageBlob = await imageResponse.blob()
      const imageDataUrl = URL.createObjectURL(imageBlob)

      const { character: newCharacter } = await createCharacter(duplicatedContent, imageDataUrl)

      setActiveCharacterOrGroup(newCharacter.id)

      setOpen(false)
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Duplicate Character</DialogTitle>
          <DialogDescription>
            Enter a name for the duplicated character. All character data and image will be copied
            to the new character.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={newCharacterName}
          onChange={(e) => setNewCharacterName(e.target.value)}
          placeholder="Enter character name"
          autoFocus
          disabled={isDuplicating}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDuplicating}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate} disabled={!newCharacterName.trim() || isDuplicating}>
            {isDuplicating ? (
              <>
                <CircleSpinner />
                Duplicating...
              </>
            ) : (
              'Duplicate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
