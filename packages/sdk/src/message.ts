import type { UIMessage } from '@cared/shared'
import { generateId } from '@cared/shared'

import type { Message } from './trpc'

export function generateMessageId() {
  return generateId('msg')
}

export function toUIMessages(messages: Pick<Message, 'id' | 'role' | 'content'>[]): UIMessage[] {
  return messages.map((msg) => {
    return {
      id: msg.id,
      role: msg.role,
      ...msg.content,
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
    branch.push(currentMessage) // Add the current message to the branch.
    const parentId = currentMessage.parentId
    if (!parentId) {
      break // Reached the root of the branch.
    }
    currentMessage = messageMap.get(parentId) // Get the parent message from the map.
  }

  return branch.reverse()
}
