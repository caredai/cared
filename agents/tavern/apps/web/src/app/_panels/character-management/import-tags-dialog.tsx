import type { Character } from '@/hooks/use-character'
import type { TagImportOption } from '@tavern/core'
import { useEffect, useMemo, useState } from 'react'
import { atom, useAtom } from 'jotai'

import { Button } from '@ownxai/ui/components/button'
import { Checkbox } from '@ownxai/ui/components/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ownxai/ui/components/dialog'

import { Tag } from '@/components/tag'
import { useTagsSettings, useUpdateTagsSettings } from '@/hooks/use-settings'

const openAtom = atom(false)
const characterAtom = atom<Character | undefined>(undefined)

// Function to handle tag importing logic
async function importTags(
  character: Character,
  importType: TagImportOption,
  embeddedTags: string[],
  existingTags: string[],
  selectedTags: string[],
  tagsSettings: ReturnType<typeof useTagsSettings>,
  updateSettings: ReturnType<typeof useUpdateTagsSettings>,
  rememberChoice = false,
) {
  const tagsToImport = (() => {
    switch (importType) {
      case 'none':
        return []
      case 'all':
        return embeddedTags
      case 'existing':
        return existingTags
      case 'ask':
        return selectedTags
      default:
        return []
    }
  })()

  // Update tags in settings
  const existingTagNames = tagsSettings.tags.map((t) => t.name)
  const newTagObjects = tagsToImport
    .filter((tag) => !existingTagNames.includes(tag))
    .map((tag) => ({
      name: tag,
      folder: 'no' as const,
    }))
  const newTags = [...tagsSettings.tags, ...newTagObjects]

  // Update tag mapping for the character
  const newTagMap = { ...tagsSettings.tagMap }
  newTagMap[character.id] = Array.from(
    new Set([...(newTagMap[character.id] ?? []), ...tagsToImport]),
  )

  await updateSettings({
    tags: newTags,
    tagMap: newTagMap,
    ...(rememberChoice && { importOption: importType }),
  })
}

export function useImportTags() {
  const [, setOpen] = useAtom(openAtom)
  const [, setCharacter] = useAtom(characterAtom)
  const tagsSettings = useTagsSettings()
  const updateSettings = useUpdateTagsSettings()

  return async (character: Character, useRememberedImportOption?: boolean) => {
    // Handle automatic import based on remembered option
    if (useRememberedImportOption && tagsSettings.importOption !== 'ask') {
      const embeddedTags = character.content.data.tags
      const existingTagNames = tagsSettings.tags.map((t) => t.name)
      const existingTags = embeddedTags.filter((tag) => existingTagNames.includes(tag))

      await importTags(
        character,
        tagsSettings.importOption,
        embeddedTags,
        existingTags,
        [],
        tagsSettings,
        updateSettings,
        false,
      )

      return
    }

    // Otherwise show dialog
    setCharacter(character)
    setOpen(true)
  }
}

export function ImportTagsDialog() {
  const [open, setOpen] = useAtom(openAtom)
  const [character, setCharacter] = useAtom(characterAtom)
  const embeddedTags = useMemo(() => character?.content.data.tags ?? [], [character])

  const [rememberChoice, setRememberChoice] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const tagsSettings = useTagsSettings()
  const updateSettings = useUpdateTagsSettings()

  // Separate tags into existing and new
  const { existingTags, newTags } = useMemo(() => {
    const existing: string[] = []
    const newOnes: string[] = []

    embeddedTags.forEach((tag) => {
      if (tagsSettings.tags.map((t) => t.name).includes(tag)) {
        existing.push(tag)
      } else {
        newOnes.push(tag)
      }
    })

    return { existingTags: existing, newTags: newOnes }
  }, [embeddedTags, tagsSettings.tags])

  // Initialize selected tags with all tags
  useEffect(() => {
    setSelectedTags([...embeddedTags])
  }, [embeddedTags])

  useEffect(() => {
    if (!open) {
      setCharacter(undefined)
      setSelectedTags([])
      setRememberChoice(false)
    }
  }, [open, setCharacter])

  const handleImport = (importType: TagImportOption) => {
    setOpen(false)
    if (!character) return

    return importTags(
      character,
      importType,
      embeddedTags,
      existingTags,
      selectedTags,
      tagsSettings,
      updateSettings,
      rememberChoice,
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  if (!character || !embeddedTags.length) {
    return null
  }

  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] z-6000">
        <DialogHeader>
          <DialogTitle>Import tags for {character.content.data.name}</DialogTitle>
          <DialogDescription>
            Click any tag to toggle its selection status. Selected tags will be imported. Choose an
            import option to finish importing the tags.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 my-4">
          {existingTags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Existing Tags</h3>
              <div className="flex flex-wrap gap-2">
                {existingTags.map((tag) => (
                  <Tag
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {newTags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">New Tags</h3>
              <div className="flex flex-wrap gap-2">
                {newTags.map((tag) => (
                  <Tag
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberChoice}
              onCheckedChange={(checked) => setRememberChoice(checked as boolean)}
            />
            <label
              htmlFor="remember"
              title='Remember the chosen import option.

If anything besides &apos;Cancel&apos; and &apos;Import&apos; is selected, this dialog will not show up anymore.
To change this, go to the settings and modify "Tag Import Option".

If the "Import" option is chosen, the global setting will stay on "Ask".'
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember my choice
            </label>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleImport('none')}>
            Import None
          </Button>
          <Button variant="outline" onClick={() => handleImport('all')}>
            Import All
          </Button>
          <Button variant="outline" onClick={() => handleImport('existing')}>
            Import Existing
          </Button>
          <Button onClick={() => handleImport('ask')}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
