import { useState } from 'react'

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

import { CircleSpinner } from '@/components/spinner'
import { useDeletePersona, usePersonas } from '@/hooks/use-persona'
import type { Persona } from '@/hooks/use-persona'
import { usePersonaSettings, useUpdatePersonaSettings } from '@/hooks/use-settings'

export function DeletePersonaDialog({
  trigger,
  persona,
}: {
  trigger: React.ReactNode
  persona: Persona
}) {
  const deletePersona = useDeletePersona()
  const { personas } = usePersonas()
  const personaSettings = usePersonaSettings()
  const updatePersonaSettings = useUpdatePersonaSettings()
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await deletePersona(persona.id)

      // If the deleted persona was active, set the first remaining persona as active
      if (personaSettings.active === persona.id) {
        const remainingPersonas = personas.filter(p => p.id !== persona.id)
        const newActivePersona = remainingPersonas[0]
        
        await updatePersonaSettings({
          active: newActivePersona?.id,
        })
      }

      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Delete Persona</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete persona "{persona.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
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
