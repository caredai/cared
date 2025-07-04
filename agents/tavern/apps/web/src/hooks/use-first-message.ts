import { useEffect } from 'react'
import { getCharFirstMessages, substituteMacros } from '@tavern/core'
import { atom, useAtom } from 'jotai'

import { generateMessageId } from '@ownxai/sdk'

import { useActive } from '@/hooks/use-active'
import { isCharacter } from '@/hooks/use-character-or-group'
import { useCreateMessage, useDeleteMessage, useUpdateMessage } from '@/hooks/use-message'
import { useMessageTree } from '@/hooks/use-message-tree'

const hasAttemptedCheckAtom = atom(false)

export function useCheckFirstMessage() {
  const { tree, branch, isSuccess, hasNextPage } = useMessageTree()
  const { settings, modelPreset, model, charOrGroup, persona, chat } = useActive()
  const createMessage = useCreateMessage(chat?.id)
  const updateMessage = useUpdateMessage(chat?.id)
  const deleteMessage = useDeleteMessage(chat?.id)

  const [hasAttemptedCheck, setHasAttemptedCheck] = useAtom(hasAttemptedCheckAtom)

  useEffect(() => {
    console.log('############### useCheckFirstMessage')
  }, [
    branch.length,
    charOrGroup,
    createMessage,
    deleteMessage,
    hasAttemptedCheck,
    hasNextPage,
    isSuccess,
    model,
    modelPreset,
    persona,
    setHasAttemptedCheck,
    settings,
    tree,
    updateMessage,
  ])

  useEffect(() => {
    if (!isSuccess || hasNextPage || !model || !charOrGroup || !persona) {
      return
    }
    console.log('############### OK')

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

      if (!branch.length || !tree) {
        if (tree) {
          return // never happen
        }

        if (hasAttemptedCheck) {
          return
        }
        setHasAttemptedCheck(true)

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
      } else if (!tree.tree.some((rootNode) => rootNode.descendants.length)) {
        const actions: (() => Promise<any>)[] = []

        const messages = tree.tree.map((rootNode) => rootNode.message)

        if (messages.length > initialMessages.length) {
          const removeMessages = messages.slice(initialMessages.length)
          removeMessages.forEach((msg) => {
            actions.push(() => deleteMessage(msg.id))
          })
        }

        if (initialMessages.length > messages.length) {
          const addMessages = initialMessages.slice(messages.length)
          addMessages.forEach((msg) => {
            actions.push(() =>
              createMessage({
                id: generateMessageId(),
                ...msg,
              }),
            )
          })
        }

        const updateMessages = messages.slice(0, Math.min(messages.length, initialMessages.length))
        updateMessages.forEach((msg, index) => {
          const initialMsg = initialMessages[index]!
          actions.push(() => updateMessage(msg.id, initialMsg.content))
        })

        if (hasAttemptedCheck) {
          return
        }
        setHasAttemptedCheck(true)

        void Promise.all(actions.map((action) => action())).finally(() => {
          setHasAttemptedCheck(false)
        })
      }
    } else {
      // TODO
    }
  }, [
    branch.length,
    charOrGroup,
    createMessage,
    deleteMessage,
    hasAttemptedCheck,
    hasNextPage,
    isSuccess,
    model,
    modelPreset,
    persona,
    setHasAttemptedCheck,
    settings,
    tree,
    updateMessage,
  ])
}
