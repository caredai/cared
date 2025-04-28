import { faLock, faUnlock } from '@fortawesome/free-solid-svg-icons'

import { TooltipFaButton } from '@/components/fa-button'
import { useAppearanceSettings, useUpdateSettingsMutation } from '@/lib/settings'

export function CharacterManagementHeader() {
  const appearanceSettings = useAppearanceSettings()

  const updateSettingsMutation = useUpdateSettingsMutation()

  return (
    <div className="flex flex-row items-center justify-between gap-2">
      <div>
        <TooltipFaButton
          icon={appearanceSettings.rightNavPanelLocked ? faLock : faUnlock}
          btnSize="size-6"
          iconSize="xl"
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
      </div>
      <div className="flex flex-row"></div>
    </div>
  )
}
