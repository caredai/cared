import type { Prompt } from '@tavern/core'
import { useCallback } from 'react'
import {
  faLocationDot,
  faPen,
  faSquarePollHorizontal,
  faUserPen,
} from '@fortawesome/free-solid-svg-icons'

import { Button } from '@ownxai/ui/components/button'
import { Switch } from '@ownxai/ui/components/switch'
import { cn } from '@ownxai/ui/lib/utils'

import { FaButton } from '@/components/fa-button'
import { useActiveModelPreset, useCustomizeModelPreset } from '@/hooks/use-model-preset'
import { usePromptEdit } from './prompt-edit'
import { usePromptInspect } from './prompt-inspect'

export function PromptList() {
  const { activePreset } = useActiveModelPreset()
  const { openPromptEdit } = usePromptEdit()
  const { openPromptInspect } = usePromptInspect()

  // Get prompts from active preset
  const prompts = activePreset.preset.prompts

  const { customization, saveCustomization } = useCustomizeModelPreset()

  // Handle prompt enable/disable
  const handleTogglePrompt = useCallback(
    async (prompt: Prompt, enabled: boolean) => {
      await saveCustomization({
        ...customization,
        prompts: {
          ...customization?.prompts,
          [prompt.identifier]: {
            ...customization?.prompts?.[prompt.identifier],
            enabled,
          },
        },
      })
    },
    [customization, saveCustomization],
  )

  return (
    <div className="flex flex-col gap-2 border border-border p-2 rounded-sm bg-black/20">
      {prompts.map((prompt: Prompt) => {
        return (
          <div
            key={prompt.identifier}
            className="flex justify-between items-center gap-4 px-2 py-1 rounded-sm border border-border hover:bg-muted/50"
          >
            <FaButton
              icon={
                prompt.system_prompt
                  ? prompt.marker
                    ? faLocationDot
                    : faSquarePollHorizontal
                  : faUserPen
              }
              btnSize="size-6"
              iconSize="lg"
              className={cn('text-muted-foreground')}
              title={
                prompt.system_prompt
                  ? prompt.marker
                    ? 'System Marker Prompt'
                    : 'System Prompt'
                  : 'User-defined Prompt'
              }
            />

            <Button
              variant="link"
              className="flex-1 justify-start text-secondary-foreground truncate"
              title={prompt.name}
              onClick={() => openPromptInspect(prompt)}
            >
              <span className="truncate">{prompt.name}</span>
            </Button>

            <div className="flex justify-between items-center">
              <FaButton
                icon={faPen}
                btnSize="size-6"
                iconSize="sm"
                className="text-muted-foreground hover:text-foreground"
                title="Edit prompt"
                onClick={() => openPromptEdit({
                  ...prompt,
                  role: prompt.role ?? 'system',
                  injection_position: prompt.injection_position ?? 'relative',
                  injection_depth: prompt.injection_depth ?? 4,
                  content: prompt.content ?? '',
                })}
              />

              <Switch
                checked={prompt.enabled}
                onCheckedChange={(checked: boolean) => {
                  void handleTogglePrompt(prompt, checked)
                }}
                className="data-[state=checked]:bg-yellow-700 scale-60"
              />
            </div>

            <span className="text-sm text-muted-foreground w-16 text-right">0 tokens</span>
          </div>
        )
      })}
    </div>
  )
}
