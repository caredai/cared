import type { PromptCollection } from '@tavern/core'
import { useEffect, useState } from 'react'
import { buildPromptMessages } from '@tavern/core'

import { useActivatedCharacters } from '@/hooks/use-activate-characters'
import { useActive } from '@/hooks/use-active'
import { isCharacterGroup } from '@/hooks/use-character-or-group'
import { useMessageTree } from '@/hooks/use-message-tree'
import { countTokens } from '@/lib/tokenizer'

export function usePromptCollections() {
  const { settings, modelPreset, model, charOrGroup, persona, chat, lorebooks } = useActive()
  const { branch } = useMessageTree()
  const { nextActivatedCharacter } = useActivatedCharacters()

  const [promptCollections, setPromptCollections] = useState<PromptCollection[]>([])

  useEffect(() => {
    async function build() {
      if (!chat || !model || !persona || !charOrGroup) {
        return
      }

      const messages = [...branch]

      const nextChar = nextActivatedCharacter()
      if (!nextChar) {
        return
      }

      const { promptCollections } = await buildPromptMessages({
        generateType: 'normal',
        messages: messages, // TODO
        chat,
        settings,
        modelPreset,
        model,
        persona,
        character: nextChar,
        group: isCharacterGroup(charOrGroup) ? charOrGroup : undefined,
        lorebooks,
        countTokens,
      })

      return promptCollections
    }

    void build().then((c) => setPromptCollections(c ?? []))
  }, [
    branch,
    charOrGroup,
    chat,
    lorebooks,
    model,
    modelPreset,
    nextActivatedCharacter,
    persona,
    settings,
  ])

  return promptCollections
}
