'use client'

import { Separator } from '@cared/ui/components/separator'

import { isCharacterGroup, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { CharacterCreate } from './character-create'
import { CharacterGroupView } from './character-group-view'
import { CharacterList } from './character-list'
import { CharacterView } from './character-view'
import { ChatListView } from './chat-list-view'
import { CharacterManagementHeader } from './header'
import {
  useClearAllFlags,
  useIsCreateCharacter,
  useIsCreateCharacterGroup,
  useShowCharacterList,
  useShowChatList,
} from './hooks'
import { ImportTagsDialog } from './import-tags-dialog'
import { TagsManagementDialog } from './tags-management-dialog'

export function CharacterManagementPanel() {
  const activeCharacter = useActiveCharacterOrGroup()
  const isCreateCharacter = useIsCreateCharacter()
  const isCreateCharacterGroup = useIsCreateCharacterGroup()
  const showCharacterList = useShowCharacterList()
  const showChatList = useShowChatList()
  const clearAllFlags = useClearAllFlags()

  return (
    <div className="flex flex-col gap-2 h-full p-1.5 pr-0 overflow-hidden">
      <CharacterManagementHeader />

      <Separator className="bg-gradient-to-r from-transparent via-ring/50 to-transparent" />

      {!isCreateCharacter && activeCharacter && (
        <h1
          className="font-semibold text-xl text-muted-foreground hover:text-primary-foreground cursor-pointer truncate"
          onClick={clearAllFlags}
        >
          {isCharacterGroup(activeCharacter)
            ? activeCharacter.metadata.name
            : activeCharacter.content.data.name}
        </h1>
      )}

      {!showCharacterList && isCreateCharacter && <CharacterCreate />}
      {!showCharacterList && isCreateCharacterGroup && <CharacterGroupView />}

      {!showCharacterList &&
        !isCreateCharacter &&
        !isCreateCharacterGroup &&
        !showChatList &&
        activeCharacter &&
        (isCharacterGroup(activeCharacter) ? (
          <CharacterGroupView group={activeCharacter} />
        ) : (
          <CharacterView character={activeCharacter} />
        ))}

      {showCharacterList && <CharacterList />}

      {showChatList && <ChatListView />}

      <ImportTagsDialog />
      <TagsManagementDialog />
    </div>
  )
}
