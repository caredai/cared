import type { Character } from '@/hooks/use-character'

import { Checkbox } from '@ownxai/ui/components/checkbox'
import { cn } from '@ownxai/ui/lib/utils'

import { CharacterAvatar } from '@/components/avatar'
import { Tag } from '@/components/tag'
import { useTagsSettings } from '@/hooks/use-settings'

export function CharacterItem({
  character,
  isSelectMode = false,
  isSelected = false,
  onSelect,
}: {
  character: Character
  isSelectMode?: boolean
  isSelected?: boolean
  onSelect: (characterId: string, selected: boolean, event?: React.MouseEvent) => void
}) {
  const handleClick = (event: React.MouseEvent) => {
    onSelect(character.id, !isSelected, event)

    // Clear any existing text selection
    window.getSelection()?.removeAllRanges()
  }

  const data = character.content.data

  const tagsSettings = useTagsSettings()
  const tags = tagsSettings.tagMap[character.id]

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

      <CharacterAvatar src={character.metadata.url} alt={data.name} />

      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-medium text-yellow-400">{data.name}</h3>
          <span className="text-xs text-muted-foreground">{data.character_version}</span>
        </div>
        <p
          className={cn(
            'text-sm text-secondary-foreground line-clamp-1',
            isSelected && 'text-secondary-foreground',
          )}
        >
          {data.creator_notes}
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
