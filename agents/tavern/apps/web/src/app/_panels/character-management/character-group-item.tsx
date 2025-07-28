import type { Character } from '@/hooks/use-character'
import {
  faChevronDown,
  faChevronUp,
  faComment,
  faEye,
  faEyeSlash,
  faImagePortrait,
  faPlus,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

import { cn } from '@cared/ui/lib/utils'

import { CharacterAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import { Tag } from '@/components/tag'
import { useTagsSettings } from '@/hooks/use-settings'

export function CharacterGroupItem({
  character,
  disabled,
  onToggleDisabled,
  onTrigger,
  onMoveUp,
  onMoveDown,
  onSelect,
  onAdd,
  onRemove,
}: {
  character: Character
  disabled?: boolean
  onToggleDisabled?: () => void
  onTrigger?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
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
      action: onMoveUp,
      action2: onMoveDown,
      icon: faChevronUp,
      icon2: faChevronDown,
      tooltip: 'Move up',
      tooltip2: 'Move down',
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

  return (
    <div className={cn('flex items-center gap-1 py-1 rounded-lg cursor-default')}>
      <CharacterAvatar src={character.metadata.url} alt={data.name} className="cursor-default" />

      <div className="flex-1 flex flex-col gap-1">
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

      <div className="ml-2 flex flex-wrap items-center gap-1">
        {actions
          .filter(({ action }) => !!action)
          .map(({ action, action2, icon, icon2, tooltip, tooltip2 }, index) =>
            icon2 && tooltip2 ? (
              <div key={index} className="flex flex-col">
                <FaButton
                  icon={icon}
                  btnSize="size-4"
                  iconSize="sm"
                  title={tooltip}
                  onClick={action}
                />
                <FaButton
                  icon={icon2}
                  btnSize="size-4"
                  iconSize="sm"
                  title={tooltip2}
                  onClick={action2}
                />
              </div>
            ) : (
              <FaButton
                key={index}
                icon={icon}
                btnSize="size-7"
                iconSize="xl"
                title={tooltip}
                onClick={action}
              />
            ),
          )}
      </div>
    </div>
  )
}
