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
import { useCustomizeModelPreset } from '@/hooks/use-model-preset'
import { usePromptEdit } from './prompt-edit'
import { usePromptInspect } from './prompt-inspect'

export function PromptList() {
  const { activeCustomizedPreset } = useCustomizeModelPreset()
  const { toggleEditPromptEdit } = usePromptEdit()
  const { togglePromptInspect } = usePromptInspect()

  // Get prompts from active preset
  const prompts = activeCustomizedPreset.prompts

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
            className="w-full grid grid-cols-[4fr_80px_45px] justify-between items-center px-2 py-1 rounded-sm border border-border hover:bg-muted/50"
          >
            <span className="flex items-center overflow-x-hidden">
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
                className="px-1 text-secondary-foreground"
                title={prompt.name}
                onClick={() => togglePromptInspect(prompt.identifier)}
              >
                {prompt.name}
              </Button>
            </span>

            <span className="inline w-full text-right">
              {!['dialogueExamples', 'chatHistory'].includes(prompt.identifier) && (
                <FaButton
                  icon={faPen}
                  btnSize="size-6"
                  iconSize="sm"
                  className="text-muted-foreground hover:text-foreground"
                  title="Edit prompt"
                  onClick={() => toggleEditPromptEdit(prompt.identifier)}
                />
              )}

              <Switch
                checked={prompt.enabled}
                onCheckedChange={(checked: boolean) => {
                  void handleTogglePrompt(prompt, checked)
                }}
                className="data-[state=checked]:bg-yellow-700 scale-60"
              />
            </span>

            <span className="inline w-full text-sm text-muted-foreground text-right">0</span>
          </div>
        )
      })}
    </div>
  )
}
