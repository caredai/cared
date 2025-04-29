import type { Character } from '@tavern/db/schema'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CharacterAvatar } from '@/components/avatar'

interface CharacterItemProps {
  character: Character
  isSelectMode?: boolean
  isSelected?: boolean
  onSelect?: (characterId: string, selected: boolean) => void
}

export function CharacterItem({
  character,
  isSelectMode = false,
  isSelected = false,
  onSelect,
}: CharacterItemProps) {
  const handleClick = () => {
    if (isSelectMode && onSelect) {
      onSelect(character.id, !isSelected)
    }
  }

  const data = character.content.data

  return (
    <div
      className={`flex flex-row items-center gap-1 px-1 py-2 rounded-lg cursor-pointer hover:bg-ring/50 transition-colors ${
        isSelected ? 'bg-ring/50' : ''
      }`}
      onClick={handleClick}
    >
      {isSelectMode && (
        <div className="w-6 h-6 flex items-center justify-center">
          <div
            className={`w-5 h-5 border-2 rounded-md flex items-center justify-center ${
              isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`}
          >
            {isSelected && (
              <FontAwesomeIcon icon={faCheck} className="text-primary-foreground" />
            )}
          </div>
        </div>
      )}
      <CharacterAvatar src={character.metadata.url} alt={data.name} />
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-medium text-yellow-400">{data.name}</h3>
          <span className="text-xs text-muted-foreground">{data.character_version}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{data.description}</p>
        <div className="flex flex-wrap gap-1">
          {data.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
