import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'

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

import { useLorebook } from '@/hooks/use-lorebook'
import { useSelectedLorebookId } from './select-lorebook'

interface ExportLorebookDialogProps {
  trigger: ReactNode
}

export function ExportLorebookDialog({ trigger }: ExportLorebookDialogProps) {
  const [open, setOpen] = useState(false)
  const { selectedLorebookId } = useSelectedLorebookId()
  const { lorebook } = useLorebook(selectedLorebookId ?? '')

  const handleExport = useCallback(() => {
    if (!lorebook) return

    // Create a blob with the lorebook data
    const blob = new Blob(
      [
        JSON.stringify(
          {
            entries: lorebook.entries,
          },
          null,
          2,
        ),
      ],
      {
        type: 'application/json',
      },
    )

    // Create a download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${lorebook.name}.json`

    // Trigger download
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Close dialog
    setOpen(false)
  }, [lorebook])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Export Lorebook</DialogTitle>
          <DialogDescription>
            Are you sure you want to export the lorebook "{lorebook?.name}"? This will download a
            JSON file containing the lorebook configuration.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
