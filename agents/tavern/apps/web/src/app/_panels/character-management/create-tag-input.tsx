import { useTagsSettings } from '@/lib/settings'
import * as React from 'react'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxGroup,
} from '@ownxai/ui/components/combobox'
// import { Virtualized, VirtualizedVirtualizer } from '@ownxai/ui/components/virtualized' // Consider if needed for very long lists

// interface CreateTagInputProps {
//   // Props to define: e.g., selected tags, onChange handler for tags
//   // For now, let's assume we manage selected tags internally or it's a simple input
//   // onTagsChange: (tags: string[]) => void;
//   // initialTags?: string[];
// }

export function CreateTagInput() {
  const tagsSettings = useTagsSettings() // Contains { isShow, importOption, tags: Tag[], tagMap }
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')

  const existingTags = React.useMemo(() => {
    // tagsSettings.tags is guaranteed to be an array (Tag[]) by useSuspenseQuery
    // and the TagsSettings type definition.
    return tagsSettings.tags.map(tag => ({ label: tag.name, value: tag.name }))
  }, [tagsSettings.tags])

  const filteredTags = React.useMemo(() => {
    if (!inputValue) {
      return existingTags
    }
    const lowerInputValue = inputValue.toLowerCase()
    return existingTags.filter(tag =>
      tag.label.toLowerCase().includes(lowerInputValue)
    )
  }, [existingTags, inputValue])

  const showCreateOption = inputValue.trim() !== '' &&
                           !existingTags.some(tag => tag.label.toLowerCase() === inputValue.trim().toLowerCase());

  const handleSelect = (value: string, isCreation: boolean) => {
    const finalValue = value.trim();
    if (!finalValue) return;

    setInputValue('')
    setOpen(false)
    if (isCreation) {
      console.log('Create new tag:', finalValue) // Placeholder action
      // TODO: Call prop to create tag, e.g., onCreateTag(finalValue)
      // This might involve updating tagsSettings globally via useUpdateTagsSettings
    } else {
      console.log('Selected existing tag:', finalValue) // Placeholder action
      // TODO: Call prop to add tag, e.g., onAddTag(finalValue)
    }
  };

  return (
    <Combobox
      type="single"
      open={open}
      onOpenChange={setOpen}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      shouldFilter={false} // We handle filtering manually
      modal={true}
    >
      <ComboboxInput placeholder="Search or create tags..." />
      <ComboboxContent className="z-5000">
        <ComboboxGroup>
          <ComboboxEmpty>
            {/* Updated empty message for clarity when creating */}
            {inputValue.trim() !== '' && showCreateOption
              ? `No existing tags found. Press Enter to create "${inputValue.trim()}".`
              : 'No tags found.'}
          </ComboboxEmpty>
          {filteredTags.map((tag) => (
            <ComboboxItem
              key={tag.value}
              value={tag.value}
              onSelect={() => {
                handleSelect(tag.value, false);
              }}
            >
              {tag.label}
            </ComboboxItem>
          ))}
          {showCreateOption && (
            <ComboboxItem
              key={`create-${inputValue.trim()}`}
              value={inputValue.trim()}
              onSelect={() => {
                handleSelect(inputValue.trim(), true);
              }}
            >
              {`Create "${inputValue.trim()}"`}
            </ComboboxItem>
          )}
        </ComboboxGroup>
      </ComboboxContent>
    </Combobox>
  )
}
