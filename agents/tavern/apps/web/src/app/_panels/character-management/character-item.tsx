import type { Character } from '@tavern/db/schema'

import { CharacterAvatar } from '@/components/avatar'

export function CharacterItem({ character }: { character: Character }) {
  const data = character.content.data

  return (
    <div className="flex flex-row items-center gap-1 p-1 rounded-lg cursor-pointer hover:bg-ring/50 transition-colors">
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
