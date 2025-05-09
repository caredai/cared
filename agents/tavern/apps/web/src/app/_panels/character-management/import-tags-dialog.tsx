import { useEffect } from 'react'
import type { CharacterCardV2 } from '@tavern/core'
import { atom, useAtom } from 'jotai'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ownxai/ui/components/dialog'
import { useTagsSettings } from '@/lib/settings'

const importTagsDialogOpenAtom = atom(false)
const importTagsDialogCharacterAtom = atom<CharacterCardV2 | undefined>()

export function useImportTagsDialog() {
  const [, setOpen] = useAtom(importTagsDialogOpenAtom)
  const [, setCharacter] = useAtom(importTagsDialogCharacterAtom)

  return (character: CharacterCardV2) => {
    setCharacter(character)
    setOpen(true)
  }
}

export function ImportTagsDialog() {
  const [open, setOpen] = useAtom(importTagsDialogOpenAtom)
  const [character, setCharacter] = useAtom(importTagsDialogCharacterAtom)
  const embeddedTags = character?.data.tags

  const tagsSettings = useTagsSettings()

  useEffect(() => {
    if (!open) {
      setCharacter(undefined)
    }
  }, [open, setCharacter])

  if (!character || !embeddedTags) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import tags for {character.data.name}</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
