import { useCustomizeModelPreset } from '@/hooks/use-model-preset'

export function usePrompt(identifier?: string) {
  const { activeCustomizedPreset } = useCustomizeModelPreset()
  return identifier
    ? activeCustomizedPreset.prompts.find((p) => p.identifier === identifier)
    : undefined
}
