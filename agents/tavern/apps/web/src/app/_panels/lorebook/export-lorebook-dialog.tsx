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
import { Label } from '@ownxai/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@ownxai/ui/components/radio-group'

import { useSelectedLorebook } from './select-lorebook'

type ExportFormat = 'cryptotavern' | 'sillytavern'

export function ExportLorebookDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('cryptotavern')
  const { selectedLorebook } = useSelectedLorebook()

  const handleExport = useCallback(() => {
    if (!selectedLorebook) return

    let exportData: any

    if (exportFormat === 'cryptotavern') {
      // CryptoTavern format
      exportData = {
        entries: selectedLorebook.entries,
      }
    } else {
      // SillyTavern format
      const entriesObject: Record<string, any> = {}

      const selectiveLogicMap: Record<string, number> = {
        andAny: 0,
        notAll: 1,
        notAny: 2,
        andAll: 3,
      }

      selectedLorebook.entries.forEach((entry, index) => {
        const sillyTavernEntry: any = {
          uid: entry.uid,
          key: entry.keys,
          keysecondary: entry.secondaryKeys ?? [],
          comment: entry.comment,
          content: entry.content,
          constant: entry.constant,
          vectorized: entry.vectorized,
          selective: entry.selective,
          order: entry.order,
          position: entry.position,
          disable: entry.disabled,
          displayIndex: index, // Sorting
          addMemo: entry.addMemo,
          group: entry.group,
          groupOverride: entry.groupOverride,
          groupWeight: entry.groupWeight,
          sticky: entry.sticky,
          cooldown: entry.cooldown,
          delay: entry.delay,
          probability: entry.probability,
          depth: entry.depth ?? null,
          useProbability: entry.useProbability,
          role: entry.role ?? null,
          excludeRecursion: entry.excludeRecursion,
          preventRecursion: entry.preventRecursion,
          delayUntilRecursion: entry.delayUntilRecursion,
          scanDepth: entry.scanDepth ?? null,
          caseSensitive: entry.caseSensitive ?? null,
          matchWholeWords: entry.matchWholeWords ?? null,
          useGroupScoring: entry.useGroupScoring ?? null,
          automationId: entry.automationId ?? '',
          matchPersonaDescription: entry.matchPersonaDescription ?? false,
          matchCharacterDescription: entry.matchCharacterDescription ?? false,
          matchCharacterPersonality: entry.matchCharacterPersonality ?? false,
          matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt ?? false,
          matchScenario: entry.matchScenario ?? false,
          matchCreatorNotes: entry.matchCreatorNotes ?? false,
        }

        sillyTavernEntry.selectiveLogic = selectiveLogicMap[entry.selectiveLogic] ?? 0

        if (entry.characterFilter) {
          sillyTavernEntry.characterFilter = entry.characterFilter
        }

        entriesObject[entry.uid.toString()] = sillyTavernEntry
      })

      exportData = {
        entries: entriesObject,
      }
    }

    // Create a blob with the lorebook data
    const blob = new Blob(
      [
        JSON.stringify(exportData, null, 2),
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
  }, [selectedLorebook, exportFormat])

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
                <RadioGroupItem id="cryptotavern" className="border-ring" value="cryptotavern" />
                <Label htmlFor="cryptotavern" className="font-normal">
                  CryptoTavern Format
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem id="sillytavern" className="border-ring" value="sillytavern" />
                <Label htmlFor="sillytavern" className="font-normal">
                  SillyTavern Format
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

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
