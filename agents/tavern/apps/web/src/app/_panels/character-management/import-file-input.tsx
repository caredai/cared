import type { RefObject } from 'react'

import { useImportCharactersFromFiles } from '@/lib/character'
import { useImportTags } from './import-tags-dialog'

export function ImportFileInput({
  ref: fileInputRef,
}: {
  ref: RefObject<HTMLInputElement | null>
}) {
  const importCharacters = useImportCharactersFromFiles()

  const importTags = useImportTags()

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const character  = (await importCharacters(event.target.files).finally(() => {
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }))?.character

    if (character) {
      await importTags(character, true)
    }
  }

  return (
    // Hidden file input
    <input
      type="file"
      ref={fileInputRef}
      className="hidden"
      accept=".png,.json,.charx"
      multiple
      onChange={handleFileChange}
    />
  )
}
