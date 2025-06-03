import type { Character } from '@/hooks/use-character'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  faComment,
  faEye,
  faEyeSlash,
  faImagePortrait,
  faPlus,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

import { cn } from '@ownxai/ui/lib/utils'

import { CharacterAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import { Tag } from '@/components/tag'
import { useTagsSettings } from '@/hooks/use-settings'

export function CharacterGroupItem({
  character,
  disabled,
  onToggleDisabled,
  onTrigger,
  onSelect,
  onAdd,
  onRemove,
}: {
  character: Character
  disabled?: boolean
  onToggleDisabled?: () => void
  onTrigger?: () => void
  onSelect?: () => void
  onAdd?: () => void
  onRemove?: () => void
}) {
  const data = character.content.data

  const tagsSettings = useTagsSettings()
  const tags = tagsSettings.tagMap[character.id]

  const actions = [
    {
      action: onToggleDisabled,
      icon: !disabled ? faEye : faEyeSlash,
      tooltip: 'Temporarily disable automatic replies from this character',
    },
    {
      action: onTrigger,
      icon: faComment,
      tooltip: 'Trigger a reply from this character',
    },
    {
      action: onSelect,
      icon: faImagePortrait,
      tooltip: 'View character card',
    },
    {
      action: onAdd,
      icon: faPlus,
      tooltip: 'Add to group',
    },
    {
      action: onRemove,
      icon: faXmark,
      tooltip: 'Remove from group',
    },
  ]

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: character.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn('flex items-center gap-1 px-1 py-2 rounded-lg', isDragging && 'invisible')}
    >
      <CharacterAvatar
        src={character.metadata.url}
        alt={data.name}
        className="cursor-grab"
        {...listeners}
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-yellow-400">{data.name}</h3>
          <span className="text-xs text-muted-foreground">{data.character_version}</span>
        </div>

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

      <div className="flex items-center gap-1">
        {actions
          .filter(({ action }) => !!action)
          .map(({ action, icon, tooltip }, index) => (
            <FaButton
              key={index}
              icon={icon}
              btnSize="size-8"
              iconSize="lg"
              title={tooltip}
              className="text-foreground hover:bg-muted-foreground"
              onClick={action}
            />
          ))}
      </div>
    </div>
  )
}
