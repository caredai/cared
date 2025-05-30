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

import { useSelectedLorebook } from './select-lorebook'

export function ExportLorebookDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { selectedLorebook } = useSelectedLorebook()

  const handleExport = useCallback(() => {
    if (!selectedLorebook) return

    // Create a blob with the lorebook data
    const blob = new Blob(
      [
        JSON.stringify(
          {
            entries: selectedLorebook.entries,
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
    link.download = `${selectedLorebook.name}.json`

    // Trigger download
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Close dialog
    setOpen(false)
  }, [selectedLorebook])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Export Lorebook</DialogTitle>
          <DialogDescription>
            Are you sure you want to export the lorebook "{selectedLorebook?.name}"? This will
            download a JSON file containing the lorebook configuration.
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
