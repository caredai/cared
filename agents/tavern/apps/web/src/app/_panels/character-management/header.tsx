'use client'

import { faListUl, faLock, faUnlock } from '@fortawesome/free-solid-svg-icons'

import { FaButton } from '@/components/fa-button'
import { useAppearanceSettings, useUpdateSettingsMutation } from '@/lib/settings'

export function CharacterManagementHeader({
  onShowCharacterList,
}: {
  onShowCharacterList: () => void
}) {
  const appearanceSettings = useAppearanceSettings()

  const updateSettingsMutation = useUpdateSettingsMutation()

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      <div className="flex flex-col gap-1">
        <FaButton
          icon={appearanceSettings.rightNavPanelLocked ? faLock : faUnlock}
          btnSize="size-6"
          iconSize="xl"
          title="If locked, character management panel will stay open"
          onClick={async () => {
            await updateSettingsMutation.mutateAsync({
              settings: {
                appearance: {
                  ...appearanceSettings,
                  rightNavPanelLocked: !appearanceSettings.rightNavPanelLocked,
                },
              },
            })
          }}
        />
        <FaButton
          icon={faListUl}
          btnSize="size-6"
          iconSize="xl"
          title="Show character list"
          onClick={onShowCharacterList}
        />
      </div>
      <div className="flex flex-row"></div>
    </div>
  )
}
