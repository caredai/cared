'use client'

import type { VListHandle } from 'virtua'
import { useMemo, useRef } from 'react'
import { faListUl, faLock, faUnlock } from '@fortawesome/free-solid-svg-icons'
import { VList } from 'virtua'

import { cn } from '@ownxai/ui/lib/utils'

import { CharacterAvatar, CharacterGroupAvatar } from '@/components/avatar'
import { FaButton } from '@/components/fa-button'
import {
  isCharacterGroup,
  useCharactersAndGroups,
  useSetActiveCharacterOrGroup,
} from '@/hooks/use-character-or-group'
import {
  useAppearanceSettings,
  useCharacterSettings,
  useUpdateSettingsMutation,
} from '@/hooks/use-settings'
import { useSetShowCharacterList } from './hooks'

export function CharacterManagementHeader() {
  const setShowCharacterList = useSetShowCharacterList()
  const appearanceSettings = useAppearanceSettings()
  const characterSettings = useCharacterSettings()
  const updateSettings = useUpdateSettingsMutation()
  const charactersAndGroups = useCharactersAndGroups()
  const setActiveCharacterOrGroup = useSetActiveCharacterOrGroup()

  // Filter favorite items
  const favoriteItems = useMemo(
    () => charactersAndGroups.filter((item) => characterSettings.favorites.includes(item.id)),
    [characterSettings, charactersAndGroups],
  )

  const vlistRef = useRef<VListHandle>(null)

  // Handle mouse wheel horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    // e.preventDefault()
    vlistRef.current?.scrollBy(e.deltaY)
  }

  return (
    <div className="flex flex-row items-center gap-4">
      <div className="flex flex-col gap-1">
        <FaButton
          icon={appearanceSettings.characterPanelLocked ? faLock : faUnlock}
          btnSize="size-6"
          iconSize="xl"
          title="If locked, character management panel will stay open"
          onClick={async () => {
            await updateSettings({
              appearance: {
                ...appearanceSettings,
                characterPanelLocked: !appearanceSettings.characterPanelLocked,
              },
            })
          }}
        />
        <FaButton
          icon={faListUl}
          btnSize="size-6"
          iconSize="xl"
          title="Show character list"
          onClick={setShowCharacterList}
        />
      </div>

      {favoriteItems.length > 0 && (
        <VList
          horizontal
          count={favoriteItems.length}
          className="flex-1 h-15 no-scrollbar"
          ref={vlistRef}
          onWheel={handleWheel}
        >
          {favoriteItems.map((item) => {
            return (
              <div
                key={item.id}
                className={cn(
                  'cursor-pointer hover:opacity-80 transition-opacity',
                  'flex items-center justify-center',
                )}
                onClick={() => setActiveCharacterOrGroup(item.id)}
              >
                {isCharacterGroup(item) ? (
                  <CharacterGroupAvatar
                    src={item.metadata.imageUrl}
                    characterAvatars={item.characters.map((c) => c.metadata.url)}
                    alt={item.metadata.name}
                  />
                ) : (
                  <CharacterAvatar src={item.metadata.url} alt={item.content.data.name} />
                )}
              </div>
            )
          })}
        </VList>
      )}
    </div>
  )
}
