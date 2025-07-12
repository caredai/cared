import { useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useActiveChat } from '@/hooks/use-chat'
import { useActiveLorebooks } from '@/hooks/use-lorebook'
import { useActiveLanguageModel } from '@/hooks/use-model'
import { useCustomizeModelPreset } from '@/hooks/use-model-preset'
import { useActivePersona } from '@/hooks/use-persona'
import { useSettings } from '@/hooks/use-settings'

export function useActive() {
  const settings = useSettings()
  const { activeCustomizedPreset: modelPreset } = useCustomizeModelPreset()
  const { activeLanguageModel: model } = useActiveLanguageModel()
  const charOrGroup = useActiveCharacterOrGroup()
  const { activePersona: persona } = useActivePersona()
  const { activeChat: chat } = useActiveChat()
  const { lorebooks } = useActiveLorebooks(
    chat?.id,
    charOrGroup?.id,
    persona?.id,
    settings.lorebook.active,
  )

  return {
    settings,
    modelPreset,
    model,
    charOrGroup,
    persona,
    chat,
    lorebooks,
  }
}
