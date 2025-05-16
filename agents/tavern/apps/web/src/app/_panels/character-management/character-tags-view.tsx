import type { TagsSettings } from '@tavern/core'
import * as React from 'react'
import { useEffect } from 'react'
import { faTags } from '@fortawesome/free-solid-svg-icons'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
} from '@ownxai/ui/components/combobox'
import { Virtualized, VirtualizedVirtualizer } from '@ownxai/ui/components/virtualized'

import { FaButton } from '@/components/fa-button'
import { ClosableTag } from '@/components/tag'
import { isCharacter, useActiveCharacter } from '@/hooks/use-active-character'
import { useTagsSettings, useUpdateTagsSettings } from '@/lib/settings'
import { useIsCreateCharacter } from './hooks'
import { useOpenTagsManagementDialog } from './tags-management-dialog'

export function CharacterTagsView() {
  const character = useActiveCharacter()

  const isCreateCharacter = useIsCreateCharacter()

  const tagsSettings = useTagsSettings()
  const updateTagsSettings = useUpdateTagsSettings()

  const [charTags, setCharTags] = React.useState<string[]>([])
  useEffect(() => {
    if (!isCreateCharacter && isCharacter(character)) {
      setCharTags(tagsSettings.tagMap[character.id] ?? [])
    } else {
      setCharTags([])
    }
  }, [character, isCreateCharacter, tagsSettings.tagMap])

  const removeCharTag = async (tag: string) => {
    const newTags = charTags.filter((t) => t !== tag)
    setCharTags(newTags)

    if (!isCreateCharacter && isCharacter(character)) {
      await updateTagsSettings({
        ...tagsSettings,
        tagMap: {
          ...tagsSettings.tagMap,
          [character.id]: newTags,
        },
      })
    }
  }

  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')

  const existingTags = React.useMemo(() => {
    return tagsSettings.tags
      .map((tag) => tag.name)
      .filter((tag) => !charTags.find((t) => t.toLowerCase() === tag.toLowerCase()))
  }, [tagsSettings.tags, charTags])

  const filteredTags = React.useMemo(() => {
    if (!inputValue.trim()) {
      return existingTags
    }
    return existingTags.filter((tag) => tag.toLowerCase().includes(inputValue.trim().toLowerCase()))
  }, [existingTags, inputValue])

  const showCreateOption =
    inputValue.trim() !== '' &&
    !existingTags.some((tag) => tag.toLowerCase() === inputValue.trim().toLowerCase())

  const handleSelect = async (value: string, isCreation: boolean) => {
    const newTag = value.trim()
    if (!newTag) {
      return
    }

    setInputValue('')
    setOpen(false)

    if (charTags.find((t) => t.toLowerCase() === newTag.toLowerCase())) {
      return
    }

    const newTags = [...charTags, newTag]
    setCharTags(newTags)

    const newTagsSettings = {} as TagsSettings
    if (!isCreateCharacter && isCharacter(character)) {
      newTagsSettings.tagMap = {
        ...tagsSettings.tagMap,
        [character.id]: newTags,
      }
    }

    if (isCreation) {
      newTagsSettings.tags = [
        ...tagsSettings.tags,
        {
          name: newTag,
          folder: 'no',
        },
      ]
      console.log('Create new tag:', newTag) // Placeholder action
      await updateTagsSettings(newTagsSettings)
    } else {
      console.log('Selected existing tag:', newTag) // Placeholder action
      if (Object.keys(newTagsSettings).length) {
        await updateTagsSettings(newTagsSettings)
      }
    }

    setOpen(true)
  }

  const openTagsManagementDialog = useOpenTagsManagementDialog()

  return (
    <div className="flex flex-col gap-4">
      {charTags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {charTags.map((tag) => {
            const t = tagsSettings.tags.find((t) => t.name === tag)
            return (
              <ClosableTag
                key={tag}
                onClick={() => removeCharTag(tag)}
                style={{
                  backgroundColor: t?.bgColor,
                  color: t?.textColor
                }}
              >
                {tag}
              </ClosableTag>
            )
          })}
        </div>
      )}

      <div className="flex gap-4 justify-between items-center">
        <Combobox
          type="single"
          open={open}
          onOpenChange={setOpen}
          inputValue={inputValue}
          onInputValueChange={setInputValue}
          className="flex-1"
        >
          <ComboboxInput placeholder="Search or create tags..." />
          <Virtualized asChild>
            <ComboboxContent className="z-5000">
              <ComboboxEmpty>No tags found.</ComboboxEmpty>
              <ComboboxGroup>
                <VirtualizedVirtualizer startMargin={32}>
                  {filteredTags.map((tag) => (
                    <ComboboxItem
                      key={tag}
                      value={tag}
                      onSelect={() => {
                        void handleSelect(tag, false)
                      }}
                      className="data-[selected=true]:bg-destructive data-[selected=true]:text-destructive-foreground"
                    >
                      {tag}
                    </ComboboxItem>
                  ))}
                  {showCreateOption && (
                    <ComboboxItem
                      key={`create-${inputValue.trim()}`}
                      value={inputValue.trim()}
                      onSelect={() => {
                        void handleSelect(inputValue.trim(), true)
                      }}
                      className="data-[selected=true]:bg-destructive data-[selected=true]:text-destructive-foreground"
                    >
                      {`Create "${inputValue.trim()}"`}
                    </ComboboxItem>
                  )}
                </VirtualizedVirtualizer>
              </ComboboxGroup>
            </ComboboxContent>
          </Virtualized>
        </Combobox>

        <FaButton
          icon={faTags}
          btnSize="size-7"
          iconSize="1x"
          title=""
          className="text-foreground border-1 hover:bg-muted-foreground rounded-sm"
          onClick={openTagsManagementDialog}
        />
      </div>
    </div>
  )
}
