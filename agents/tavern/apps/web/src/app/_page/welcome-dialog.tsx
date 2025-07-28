import { useEffect, useState } from 'react'
import { faFaceSmile } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { PersonaPosition } from '@tavern/core'

import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'

import { CircleSpinner } from '@/components/spinner'
import { useCreatePersona, usePersonas } from '@/hooks/use-persona'
import { useSession } from '@/hooks/use-session'
import { usePersonaSettings, useUpdatePersonaSettings } from '@/hooks/use-settings'

export function WelcomeDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const createPersona = useCreatePersona()
  const { personas } = usePersonas()
  const settings = usePersonaSettings()
  const updatePersonaSettings = useUpdatePersonaSettings()
  const { user } = useSession()

  const hasPersona = settings.active && personas.length > 0

  // Auto open dialog when no active persona or empty persona list
  useEffect(() => {
    if (!hasPersona) {
      setOpen(true)
      // Set default name to user's name if available
      if (user?.name) {
        setName(user.name)
      }
    }
  }, [hasPersona, user?.name])

  const handleSubmit = async () => {
    if (!name.trim()) return

    try {
      setIsLoading(true)
      const { persona } = await createPersona({
        name: name.trim(),
        metadata: {
          description: '',
          injectionPosition: PersonaPosition.InPrompt,
        },
      })
      await updatePersonaSettings({
        active: persona.id,
      })
      setOpen(false)
      setName('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        // Prevent closing if no persona exists
        if (!hasPersona) {
          return
        }
        setOpen(value)
        if (!value) {
          setName('')
        }
      }}
    >
      <DialogContent
        className="z-7000"
        onPointerDownOutside={(e) => {
          // Prevent closing on outside click if no persona exists
          if (!hasPersona) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Welcome to CryptoTavern!</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Before you get started, you must select a persona name. This can be changed at any time
            via the <FontAwesomeIcon icon={faFaceSmile} size="lg" className="fa-fw" /> icon.
          </p>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Persona Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter persona name"
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !name.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <CircleSpinner />
                  Creating...
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
