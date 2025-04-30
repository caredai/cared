import type { Character } from '@/lib/character'
import type { CharacterGroup } from '@/lib/character-group'
import { useState } from 'react'

import { Separator } from '@ownxai/ui/components/separator'

import { CharacterManagementHeader } from '@/app/_panels/character-management/header'
import { isCharacterGroup } from '@/lib/character-group'
import { CharacterGroupView } from './character-group-view'
import { CharacterList } from './character-list'
import { CharacterView } from './character-view'

export function CharacterManagementPanel() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | CharacterGroup>()
  const [showCharacterList, setShowCharacterList] = useState(true)

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      <CharacterManagementHeader onShowCharacterList={() => setShowCharacterList(true)} />

      <Separator className="bg-gradient-to-r from-transparent via-ring/50 to-transparent" />

      {selectedCharacter && (
        <h1
          className="font-semibold text-xl text-muted-foreground hover:text-primary-foreground cursor-pointer truncate"
          onClick={() => setShowCharacterList(false)}
        >
          {isCharacterGroup(selectedCharacter)
            ? (selectedCharacter.metadata?.name ?? 'Group')
            : selectedCharacter.content.data.name}
        </h1>
      )}

      {!showCharacterList && selectedCharacter ? (
        isCharacterGroup(selectedCharacter) ? (
          <CharacterGroupView group={selectedCharacter} />
        ) : (
          <CharacterView character={selectedCharacter} />
        )
      ) : (
        <CharacterList
          selectCharacter={(char) => {
            setSelectedCharacter(char)
            setShowCharacterList(false)
          }}
        />
      )}
    </div>
  )
}
