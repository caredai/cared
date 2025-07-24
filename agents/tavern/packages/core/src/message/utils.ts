import type { ReducedMessage } from '../types'

export function getMessageText(message: ReducedMessage, separator = '\n'): string {
  return message.content.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join(separator)
    .trim()
}
