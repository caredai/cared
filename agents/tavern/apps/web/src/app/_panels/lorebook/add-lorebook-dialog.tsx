import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { GlobeIcon } from 'lucide-react'

import { Button } from '@ownxai/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@ownxai/ui/components/dialog'
import { Input } from '@ownxai/ui/components/input'

import { CircleSpinner } from '@/components/spinner'
import { useCreateLorebook, useLorebooks } from '@/hooks/use-lorebook'
import { useSelectedLorebookId } from './select-lorebook'

export function AddLorebookDialog({ trigger }: { trigger?: ReactNode }) {
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const createLorebook = useCreateLorebook()
  const { lorebooks } = useLorebooks()

  const { setSelectedLorebookId } = useSelectedLorebookId()

  // Generate default lorebook name
  const generateDefaultName = useCallback(() => {
    const baseName = 'Lorebook'
    const existingNames = new Set(lorebooks.map((lb) => lb.name))

    let index = 1
    let newName = `${baseName} (${index})`

    while (existingNames.has(newName)) {
      index++
      newName = `${baseName} (${index})`
    }

    return newName
  }, [lorebooks])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)
      if (newOpen) {
        setName(generateDefaultName())
      }
    },
    [generateDefaultName],
  )

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const {
        lorebook: { id },
      } = await createLorebook(name)

      setSelectedLorebookId(id)

      setName('')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [createLorebook, name, setSelectedLorebookId])

  // Default trigger button if none provided
  const defaultTrigger = (
    <Button className="w-fit">
      <GlobeIcon className="size-4" />
      Create Lorebook
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Create New Lorebook</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Enter lorebook name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSubmit()
              }
            }}
            disabled={loading}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => void handleSubmit()} disabled={loading}>
              {loading ? (
                <>
                  <CircleSpinner />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
