import type { ReactNode } from 'react'
import { useState } from 'react'
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
import { useCreatePersona } from '@/hooks/use-persona'

export function CreatePersonaDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const createPersona = useCreatePersona()

  const handleSubmit = async () => {
    if (!name.trim()) return

    try {
      setIsLoading(true)
      await createPersona({
        name: name.trim(),
        metadata: {
          description: '',
          injectionPosition: PersonaPosition.InPrompt,
        },
      })
      setOpen(false)
      setName('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {trigger && <div onClick={() => setOpen(true)}>{trigger}</div>}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!isLoading) {
            setOpen(value)
            if (!value) {
              setName('')
            }
          }
        }}
      >
        <DialogContent className="z-7000">
          <DialogHeader>
            <DialogTitle>Create New Persona</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
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
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setName('')
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isLoading || !name.trim()}>
                {isLoading ? (
                  <>
                    <CircleSpinner />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
