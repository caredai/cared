import { Separator } from '@ownxai/ui/components/separator'

import { useActiveCharacter } from '@/hooks/use-active-character'
import { isCharacterGroup } from '@/lib/character-group'
import { CharacterCreate } from './character-create'
import { CharacterGroupView } from './character-group-view'
import { CharacterList } from './character-list'
import { CharacterView } from './character-view'
import { CharacterManagementHeader } from './header'
import { useIsCreateCharacter, useSetShowCharacterList, useShowCharacterList } from './hooks'
import { ImportTagsDialog } from './import-tags-dialog'

export function CharacterManagementPanel() {
  const activeCharacter = useActiveCharacter()
  const isCreateCharacter = useIsCreateCharacter()
  const showCharacterList = useShowCharacterList()
  const setShowCharacterList = useSetShowCharacterList()

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      <CharacterManagementHeader />

      <Separator className="bg-gradient-to-r from-transparent via-ring/50 to-transparent" />

      {!isCreateCharacter && activeCharacter && (
        <h1
          className="font-semibold text-xl text-muted-foreground hover:text-primary-foreground cursor-pointer truncate"
          onClick={() => setShowCharacterList(false)}
        >
          {isCharacterGroup(activeCharacter)
            ? (activeCharacter.metadata?.name ?? 'Group')
            : activeCharacter.content.data.name}
        </h1>
      )}

      {!showCharacterList && isCreateCharacter && <CharacterCreate />}

      {!showCharacterList &&
        !isCreateCharacter &&
        activeCharacter &&
        (isCharacterGroup(activeCharacter) ? (
          <CharacterGroupView group={activeCharacter} />
        ) : (
          <CharacterView character={activeCharacter} />
        ))}

      {showCharacterList && <CharacterList />}

      <ImportTagsDialog />
    </div>
  )
}
