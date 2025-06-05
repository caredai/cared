import type { Character } from '@/hooks/use-character'
import type { CharacterGroup } from '@/hooks/use-character-group'

import { Checkbox } from '@ownxai/ui/components/checkbox'
import { cn } from '@ownxai/ui/lib/utils'

import { CharacterAvatar, CharacterGroupAvatar } from '@/components/avatar'
import { Tag } from '@/components/tag'
import { isCharacter } from '@/hooks/use-character-or-group'
import { useTagsSettings } from '@/hooks/use-settings'

export function CharacterItem({
  charOrGroup,
  isSelectMode = false,
  isSelected = false,
  onSelect,
}: {
  charOrGroup: Character | CharacterGroup
  isSelectMode?: boolean
  isSelected?: boolean
  onSelect: (characterId: string, selected: boolean, event?: React.MouseEvent) => void
}) {
  const handleClick = (event: React.MouseEvent) => {
    onSelect(charOrGroup.id, !isSelected, event)

    // Clear any existing text selection
    window.getSelection()?.removeAllRanges()
  }

  const name = isCharacter(charOrGroup) ? charOrGroup.content.data.name : charOrGroup.metadata.name

  const tagsSettings = useTagsSettings()
  const tags = tagsSettings.tagMap[charOrGroup.id]

  return (
    <div
      className={cn(
        'flex flex-row items-center gap-1 px-1 py-2 rounded-lg cursor-pointer hover:bg-ring/50 transition-colors',
        isSelected && 'bg-orange-400/70 hover:bg-orange-400/80',
      )}
      onClick={handleClick}
    >
      {isSelectMode && (
        <Checkbox
          checked={isSelected}
          className="border-ring data-[state=checked]:bg-transparent data-[state=checked]:text-orange-300 data-[state=checked]:border-orange-300"
        />
      )}

      {isCharacter(charOrGroup) ? (
        <CharacterAvatar src={charOrGroup.metadata.url} alt={name} />
      ) : (
        <CharacterGroupAvatar
          src={charOrGroup.metadata.imageUrl}
          characterAvatars={charOrGroup.characters.map((c) => c.metadata.url)}
          alt={name}
        />
      )}

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-medium text-yellow-400">{name}</h3>
          <span className="text-xs text-muted-foreground">
            {isCharacter(charOrGroup)
              ? charOrGroup.content.data.character_version
              : `${charOrGroup.characters.length} characters`}
          </span>
        </div>
        <p
          className={cn(
            'text-sm text-secondary-foreground line-clamp-1',
            isSelected && 'text-secondary-foreground',
          )}
        >
          {isCharacter(charOrGroup)
            ? charOrGroup.content.data.creator_notes
            : `${charOrGroup.characters.map((c) => c.content.data.name).join(', ')}`}
        </p>
        {(tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags?.map((tag: string) => {
              const t = tagsSettings.tags.find((t) => t.name === tag)
              return (
                <Tag
                  key={tag}
                  style={{
                    backgroundColor: t?.bgColor,
                    color: t?.textColor,
                  }}
                >
                  {tag}
                </Tag>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
