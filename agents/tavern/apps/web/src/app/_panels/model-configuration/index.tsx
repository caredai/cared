'use client'

import {
  faBinoculars,
  faFileCirclePlus,
  faFileExport,
  faFileImport,
  faLock,
  faSave,
  faTrashCan,
  faUnlock,
} from '@fortawesome/free-solid-svg-icons'

import { Label } from '@ownxai/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'

import { FaButton } from '@/components/fa-button'
import { useActiveModelPreset, useModelPresets } from '@/hooks/use-model-preset'
import {
  useAppearanceSettings,
  useModelPresetSettings,
  useUpdateSettingsMutation,
} from '@/lib/settings'
import { PromptEdit } from './prompt-edit'
import { PromptInspect } from './prompt-inspect'
import { PromptList } from './prompt-list'

export function ModelConfigurationPanel() {
  const appearanceSettings = useAppearanceSettings()

  const updateSettingsMutation = useUpdateSettingsMutation()

  const presetSettings = useModelPresetSettings()
  const { modelPresets: presets } = useModelPresets()
  const { activePreset, setActivePreset } = useActiveModelPreset()

  const handleUpdatePreset = () => {}

  const operateActions = [
    {
      action: handleUpdatePreset,
      icon: faSave,
      tooltip: 'Update current preset',
    },
    {
      action: handleUpdatePreset,
      icon: faBinoculars,
      tooltip: 'View current preset',
    },
    {
      action: handleUpdatePreset,
      icon: faFileCirclePlus,
      tooltip: 'Save as...',
    },
    {
      action: handleUpdatePreset,
      icon: faFileImport,
      tooltip: 'Import preset',
    },
    {
      action: handleUpdatePreset,
      icon: faFileExport,
      tooltip: 'Export preset',
    },
    {
      action: handleUpdatePreset,
      icon: faTrashCan,
      tooltip: 'Delete preset',
    },
  ]

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      <div className="flex flex-row items-center justify-between gap-4 m-[1px]">
        <FaButton
          icon={appearanceSettings.leftNavPanelLocked ? faLock : faUnlock}
          btnSize="size-6"
          iconSize="xl"
          title="If locked, character management panel will stay open"
          onClick={async () => {
            await updateSettingsMutation.mutateAsync({
              settings: {
                appearance: {
                  ...appearanceSettings,
                  leftNavPanelLocked: !appearanceSettings.leftNavPanelLocked,
                },
              },
            })
          }}
        />

        <Label>LLM Preset</Label>

        <Select value={activePreset.name} onValueChange={setActivePreset}>
          <SelectTrigger className="flex-1 h-7 px-2 py-0.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-6000">
            {presets.map((preset) => (
              <SelectItem key={preset.name} value={preset.name} className="py-0.5">
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end items-center gap-1">
        {operateActions.map(({ action, icon, tooltip }, index) => (
          <FaButton
            key={index}
            icon={icon}
            btnSize="size-6"
            iconSize="1x"
            title={tooltip}
            className="text-foreground border-1 border-border hover:bg-muted-foreground rounded-sm"
            onClick={action}
          />
        ))}
      </div>

      <div className="space-y-4">
        <PromptList />
      </div>

      <PromptInspect />
      <PromptEdit />
    </div>
  )
}
