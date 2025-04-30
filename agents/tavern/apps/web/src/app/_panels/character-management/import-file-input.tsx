import type { RefObject } from 'react'

import { useImportCharactersFromFiles } from '@/lib/character'

export function ImportFileInput({
  ref: fileInputRef,
}: {
  ref: RefObject<HTMLInputElement | null>
}) {
  const importCharacters = useImportCharactersFromFiles()

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void importCharacters(event.target.files).finally(() => {
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    })
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
