'use client'

import { faListUl, faLock, faUnlock } from '@fortawesome/free-solid-svg-icons'

import { FaButton } from '@/components/fa-button'
import { useAppearanceSettings, useUpdateSettingsMutation } from '@/hooks/use-settings'
import { useSetShowCharacterList } from './hooks'

export function CharacterManagementHeader() {
  const setShowCharacterList = useSetShowCharacterList()

  const appearanceSettings = useAppearanceSettings()

  const updateSettings = useUpdateSettingsMutation()

  return (
    <div className="flex flex-row items-center justify-between gap-2">
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
      <div className="flex flex-row"></div>
    </div>
  )
}
