import type { Character } from '@/hooks/use-character'
import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { pngRead } from '@tavern/core'

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
import { Label } from '@cared/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@cared/ui/components/radio-group'

import { CircleSpinner } from '@/components/spinner'
import { useSyncCharacter } from '@/hooks/use-character'

type ExportFormat = 'png' | 'json'

export function ExportCharacterDialog({
  trigger,
  character,
}: {
  trigger: ReactNode
  character: Character
}) {
  const [open, setOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [isLoading, setIsLoading] = useState(false)
  const syncCharacter = useSyncCharacter()

  const handleExport = useCallback(async () => {
    setIsLoading(true)

    try {
      await syncCharacter(character.id)

      const response = await fetch(character.metadata.url)
      if (!response.ok) {
        throw new Error('Failed to fetch character image')
      }

      // Prepare blob and filename based on export format
      let blob: Blob
      let filename: string

      if (exportFormat === 'png') {
        // Download PNG image directly
        blob = await response.blob()
        filename = `${character.content.data.name}.png`
      } else {
        // Download JSON data from PNG image
        const bytes = await response.arrayBuffer()
        const jsonData = JSON.parse(pngRead(new Uint8Array(bytes)))
        blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
        filename = `${character.content.data.name}.json`
      }

      // Download the file
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [character, exportFormat, syncCharacter])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="z-7000">
        <DialogHeader>
          <DialogTitle>Export Character</DialogTitle>
          <DialogDescription>
            Export character "{character.content.data.name}" in your preferred format. PNG format
            includes the character image with embedded data, while JSON format contains only the
            character data.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="export-format">Export Format</Label>
            <RadioGroup
              id="export-format"
              value={exportFormat}
              onValueChange={(value: ExportFormat) => setExportFormat(value)}
              className="flex flex-col gap-1.5"
            >
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem id="png" className="border-ring" value="png" />
                <Label htmlFor="png" className="font-normal">
                  PNG
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem id="json" className="border-ring" value="json" />
                <Label htmlFor="json" className="font-normal">
                  JSON
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? (
              <>
                <CircleSpinner />
                Exporting...
              </>
            ) : (
              'Export'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
