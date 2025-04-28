import type { UIMessage } from '@ownxai/shared'
import { generateId } from '@ownxai/shared'

import type { Message } from './trpc'

export function generateMessageId() {
  return generateId('msg')
}

export function toUIMessages(messages: Message[]): UIMessage[] {
  return messages.map((msg) => {
    return {
      id: msg.id,
      role: msg.role,
      ...msg.content,
      createdAt: msg.createdAt,
    }
  })
}

export function buildMessageBranchFromDescendant(
  messages: Message[],
  descendant: Message,
): Message[] {
  // Create a map for quick lookup of messages by their ID.
  const messageMap = new Map<string, Message>(messages.map((msg) => [msg.id, msg]))

  // Initialize the branch array with the descendant message.
  const branch: Message[] = []
  let currentMessage: Message | undefined = descendant

  // Traverse up the message tree using parentId until the root is reached,
  // or a message is not found in the map.
  while (currentMessage) {
    branch.push(currentMessage) // Add the current message to the beginning of the array.
    const parentId = currentMessage.parentId
    if (!parentId) {
      break // Reached the root of the branch.
    }
    currentMessage = messageMap.get(parentId) // Get the parent message from the map.
  }

  return branch.reverse()
}
