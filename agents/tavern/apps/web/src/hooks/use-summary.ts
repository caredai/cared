import type { Message, MessageMetadata } from '@tavern/core'
import { useCallback, useMemo } from 'react'

import { useActiveChat } from '@/hooks/use-chat'
import { useMessages, useUpdateMessage } from '@/hooks/use-message'
import { useMessageTree } from '@/hooks/use-message-tree'

export function useSummaries() {
  const { branch } = useMessageTree()

  return useMemo(
    () =>
      branch
        .map((node, index) => ({
          id: node.message.id, // treat message id as summary id
          summary: node.message.content.annotations[0].summary,
          msg: node.message,
          msgIndex: index,
        }))
        .filter(
          (s): s is { id: string; summary: string; msg: Message; msgIndex: number } => !!s.summary,
        ),
    [branch],
  )
}

export function useCurrentSummary() {
  const summaries = useSummaries()
  return summaries[summaries.length - 1]
}

export function useUpdateSummary() {
  const { activeChat: chat } = useActiveChat()
  const { data: messages } = useMessages(chat?.id)
  const updateMessage = useUpdateMessage(chat?.id)

  return useCallback(
    async (id: string, summary: string) => {
      if (!messages) {
        return
      }

      // Find the message by id
      const message = messages.pages
        .flatMap((page) => page.messages)
        .find((message) => message.id === id)
      if (!message) {
        return
      }

      const updatedContent = {
        ...message.content,
        annotations: [
          {
            ...message.content.annotations[0],
            summary,
          },
        ] as [MessageMetadata],
      }

      return await updateMessage(id, updatedContent)
    },
    [messages, updateMessage],
  )
}

export function useDeleteSummary() {
  const { activeChat: chat } = useActiveChat()
  const { data: messages } = useMessages(chat?.id)
  const updateMessage = useUpdateMessage(chat?.id)

  return useCallback(
    async (id: string) => {
      if (!messages) {
        return
      }

      // Find the message by id
      const message = messages.pages
        .flatMap((page) => page.messages)
        .find((message) => message.id === id)
      if (!message) {
        return
      }

      const updatedContent = {
        ...message.content,
        annotations: [
          {
            ...message.content.annotations[0],
            summary: undefined,
          },
        ] as [MessageMetadata],
      }

      return await updateMessage(id, updatedContent)
    },
    [messages, updateMessage],
  )
}
