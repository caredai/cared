import { useEffect } from 'react'
import { getCharFirstMessages, substituteMacros } from '@tavern/core'
import { atom, useAtom } from 'jotai'
import hash from 'stable-hash'

import { generateMessageId } from '@ownxai/sdk'

import { useActive } from '@/hooks/use-active'
import { isCharacter } from '@/hooks/use-character-or-group'
import { useCreateMessage, useDeleteMessage, useUpdateMessage } from '@/hooks/use-message'
import { useMessageTree } from '@/hooks/use-message-tree'

const hasAttemptedCheckAtom = atom(false)

export function useCheckFirstMessage() {
  const { tree, isReady } = useMessageTree()
  const { settings, modelPreset, model, charOrGroup, persona, chat } = useActive()
  const createMessage = useCreateMessage(chat?.id)
  const updateMessage = useUpdateMessage(chat?.id)
  const deleteMessage = useDeleteMessage(chat?.id)

  const [hasAttemptedCheck, setHasAttemptedCheck] = useAtom(hasAttemptedCheckAtom)

  useEffect(() => {
    if (!isReady || !model || !charOrGroup || !persona) {
      return
    }

    if (isCharacter(charOrGroup)) {
      const character = charOrGroup

      const { evaluateMacros } = substituteMacros({
        settings,
        modelPreset,
        model,
        persona,
        character: character.content,
      })

      const firstMsgs = getCharFirstMessages(character)
      const initialMessages = firstMsgs.map((firstMsg) => {
        return {
          role: 'assistant' as const,
          content: {
            parts: [
              {
                type: 'text' as const,
                text: evaluateMacros(firstMsg),
              },
            ],
            metadata: {
              characterId: character.id,
            },
          },
        }
      })
      if (!initialMessages.length) {
        return
      }

      if (!tree) {
        if (hasAttemptedCheck) {
          return
        }
        setHasAttemptedCheck(true)

        console.log(`Adding ${initialMessages.length} root messages for character: ${character.id}`)

        void Promise.all(
          initialMessages.map((msg) =>
            createMessage({
              id: generateMessageId(),
              ...msg,
            }),
          ),
        ).finally(() => {
          setHasAttemptedCheck(false)
        })
      } else if (
        // Only check if the root messages have no descendants
        !tree.tree.some((rootNode) => rootNode.descendants.length)
      ) {
        const removeActions: (() => Promise<any>)[] = []
        const addActions: (() => Promise<any>)[] = []
        const updateActions: (() => Promise<any>)[] = []

        const rootMessages = tree.tree.map((rootNode) => rootNode.message)

        if (rootMessages.length > initialMessages.length) {
          const removeMessages = rootMessages.slice(initialMessages.length)
          removeMessages.forEach((msg) => {
            removeActions.push(() => deleteMessage(msg.id))
          })
        }

        if (initialMessages.length > rootMessages.length) {
          const addMessages = initialMessages.slice(rootMessages.length)
          addMessages.forEach((msg) => {
            addActions.push(() =>
              createMessage({
                id: generateMessageId(),
                ...msg,
              }),
            )
          })
        }

        const updateMessages = rootMessages.slice(
          0,
          Math.min(rootMessages.length, initialMessages.length),
        )
        updateMessages.forEach((msg, index) => {
          const initialMsg = initialMessages[index]!
          if (hash(msg.content) === hash(initialMsg.content)) {
            return
          }
          updateActions.push(() => updateMessage(msg.id, initialMsg.content))
        })

        const actions = [...removeActions, ...addActions, ...updateActions]
        if (!actions.length) {
          return
        }

        if (hasAttemptedCheck) {
          return
        }
        setHasAttemptedCheck(true)

        if (addActions.length) {
          console.log(`Adding ${addActions.length} root messages for character: ${character.id}`)
        }
        if (removeActions.length) {
          console.log(
            `Removing ${removeActions.length} root messages for character: ${character.id}`,
          )
        }
        if (updateActions.length) {
          console.log(
            `Updating ${updateActions.length} root messages for character: ${character.id}`,
          )
        }

        void Promise.all(actions.map((action) => action())).finally(() => {
          setHasAttemptedCheck(false)
        })
      }
    } else {
      // TODO
    }
  }, [
    charOrGroup,
    createMessage,
    deleteMessage,
    hasAttemptedCheck,
    isReady,
    model,
    modelPreset,
    persona,
    setHasAttemptedCheck,
    settings,
    tree,
    updateMessage,
  ])
}
