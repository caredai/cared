import { useEffect, useState } from 'react'

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
import { Input } from '@ownxai/ui/components/input'

import { CircleSpinner } from '@/components/spinner'
import { useCreateLorebook, useLorebooks } from '@/hooks/use-lorebook'
import { useSelectedLorebook } from './select-lorebook'

export function DuplicateLorebookDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [newLorebookName, setNewLorebookName] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  const { selectedLorebook, setSelectedLorebookId } = useSelectedLorebook()
  const { lorebooks } = useLorebooks()
  const createLorebook = useCreateLorebook()

  // Reset form when the dialog opens
  useEffect(() => {
    if (open && selectedLorebook) {
      const existingNames = new Set(lorebooks.map((lb) => lb.name))

      let index = 1
      let newName = `${selectedLorebook.name} (${index})`

      while (existingNames.has(newName)) {
        index++
        newName = `${selectedLorebook.name} (${index})`
      }

      setNewLorebookName(newName)
    }
  }, [open, selectedLorebook, lorebooks])

  const handleDuplicate = async () => {
    if (!selectedLorebook || !newLorebookName.trim()) {
      return
    }

    setIsDuplicating(true)
    try {
      const {
        lorebook: { id },
      } = await createLorebook(
        newLorebookName.trim(),
        selectedLorebook.description ?? undefined,
        structuredClone(selectedLorebook.entries),
      )

      setSelectedLorebookId(id)
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
          <DialogTitle>Duplicate Lorebook</DialogTitle>
          <DialogDescription>
            Enter a name for the duplicated lorebook. All entries will be copied to the new
            lorebook.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={newLorebookName}
          onChange={(e) => setNewLorebookName(e.target.value)}
          placeholder="Enter lorebook name"
          autoFocus
          disabled={isDuplicating}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDuplicating}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate} disabled={!newLorebookName.trim() || isDuplicating}>
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
