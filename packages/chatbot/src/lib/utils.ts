import type { CoreToolMessage, Message, ToolInvocation } from 'ai'
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { Artifact, Message as DBMessage } from '@mindworld/db/schema'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ApplicationError extends Error {
  info: string
  status: number
}

export const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as ApplicationError

    error.info = await res.json()
    error.status = res.status

    throw error
  }

  return res.json()
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]')
  }
  return []
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage
  messages: Message[]
}): Message[] {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          )

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: toolResult.result,
            }
          }

          return toolInvocation
        }),
      }
    }

    return message
  })
}

export function convertToUIMessages(messages: DBMessage[]): Message[] {
  return messages.reduce((chatMessages: Message[], message) => {
    if (message.role === 'tool') {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages,
      })
    }

    let textContent = ''
    let reasoning: string | undefined = undefined
    const toolInvocations: ToolInvocation[] = []

    if (typeof message.content === 'string') {
      textContent = message.content
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === 'text') {
          textContent += content.text
        } else if (content.type === 'tool-call') {
          toolInvocations.push({
            state: 'call',
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          })
        } else if (content.type === 'reasoning') {
          reasoning = content.reasoning
        }
      }
    }

    chatMessages.push({
      id: message.id,
      role: message.role as Message['role'],
      content: textContent,
      reasoning,
      toolInvocations,
    })

    return chatMessages
  }, [])
}

export function sanitizeUIMessages(messages: Message[]): Message[] {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message

    if (!message.toolInvocations) return message

    const toolResultIds: string[] = []

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId)
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) =>
        toolInvocation.state === 'result' || toolResultIds.includes(toolInvocation.toolCallId),
    )

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    }
  })

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 || (message.toolInvocations && message.toolInvocations.length > 0),
  )
}

export function getDocumentTimestampByIndex(documents: Artifact[], index: number) {
  return documents.at(index)?.createdAt ?? new Date()
}
