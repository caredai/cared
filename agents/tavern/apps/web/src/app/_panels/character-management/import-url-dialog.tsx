import { useState } from 'react'

import { Button } from '@cared/ui/components/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@cared/ui/components/dialog'
import { Textarea } from '@cared/ui/components/textarea'

import { useImportTags } from '@/app/_panels/character-management/import-tags-dialog'
import { CircleSpinner } from '@/components/spinner'
import { useImportCharactersFromUrls } from '@/hooks/use-character'

interface ImportUrlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportUrlDialog({ open, onOpenChange }: ImportUrlDialogProps) {
  const importCharacters = useImportCharactersFromUrls()

  const importTags = useImportTags()

  const [urls, setUrls] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleImport = async () => {
    if (!urls.trim()) return

    setIsLoading(true)
    try {
      const characters = (await importCharacters(urls))?.characters
      onOpenChange(false)
      setUrls('')
      if (characters?.length) {
        // TODO
        void importTags(characters[0]!, true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import characters from external sources</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="Enter URLs or IDs (one per line)"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">Supported sources:</p>
            <ul className="list-disc pl-4 space-y-2">
              <li>
                Chub Character (Direct Link or ID)
                <br />
                <span className="font-mono">Example: Anonymous/example-character</span>
              </li>
              <li>
                JanitorAI Character (Direct Link or UUID)
                <br />
                <span className="font-mono">
                  Example: ddd1498a-a370-4136-b138-a8cd9461fdfe_character-aqua-the-useless-goddess
                </span>
              </li>
              <li>
                Pygmalion.chat Character (Direct Link or UUID)
                <br />
                <span className="font-mono">Example: a7ca95a1-0c88-4e23-91b3-149db1e78ab9</span>
              </li>
              <li>
                AICharacterCards.com Character (Direct Link or ID)
                <br />
                <span className="font-mono">Example: AICC/aicharcards/the-game-master</span>
              </li>
              <li>
                Direct PNG Link (refer to config.yaml for allowed hosts)
                <br />
                <span className="font-mono">
                  Example: https://files.catbox.moe/notarealfile.png
                </span>
              </li>
              <li>
                RisuRealm Character (Direct Link)
                <br />
                <span className="font-mono">
                  Example: https://realm.risuai.net/character/3ca54c71-6efe-46a2-b9d0-4f62df23d712
                </span>
              </li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isLoading || !urls.trim()}>
              {isLoading ? (
                <>
                  <CircleSpinner />
                  Importing...
                </>
              ) : (
                'Import'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
