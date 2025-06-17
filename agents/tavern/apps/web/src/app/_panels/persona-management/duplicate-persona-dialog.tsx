import type { Persona } from '@/hooks/use-persona'
import { useCreatePersona } from '@/hooks/use-persona'
import { useEffect, useState } from 'react'

import { Button } from '@ownxai/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@ownxai/ui/components/dialog'
import { Input } from '@ownxai/ui/components/input'

import { CircleSpinner } from '@/components/spinner'
import { useUpdatePersonaSettings } from '@/hooks/use-settings'

export function DuplicatePersonaDialog({
  trigger,
  persona,
}: {
  trigger: React.ReactNode
  persona: Persona
}) {
  const [open, setOpen] = useState(false)
  const [newPersonaName, setNewPersonaName] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  const createPersona = useCreatePersona()
  const updatePersonaSettings = useUpdatePersonaSettings()

  // Reset form when the dialog opens
  useEffect(() => {
    if (open) {
      setNewPersonaName(persona.name)
    }
  }, [open, persona])

  const handleDuplicate = async () => {
    if (!newPersonaName.trim()) {
      return
    }

    setIsDuplicating(true)
    try {
      const metadata = {
        ...persona.metadata,
      }

      // If the persona has an image, fetch it and convert to data URL
      if (persona.metadata.imageUrl) {
        const imageResponse = await fetch(persona.metadata.imageUrl)
        const imageBlob = await imageResponse.blob()
        // Convert blob to data URL
        const reader = new FileReader()
        metadata.imageUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(imageBlob)
        })
      }

      const { persona: newPersona } = await createPersona({
        name: newPersonaName.trim(),
        metadata,
      })

      // Set the new persona as active
      await updatePersonaSettings({
        active: newPersona.id,
      })

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
          <DialogTitle>Duplicate Persona</DialogTitle>
          <DialogDescription>
            Enter a name for the duplicated persona. All persona data and image will be copied to
            the new persona.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={newPersonaName}
          onChange={(e) => setNewPersonaName(e.target.value)}
          placeholder="Enter persona name"
          autoFocus
          disabled={isDuplicating}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDuplicating}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate} disabled={!newPersonaName.trim() || isDuplicating}>
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
