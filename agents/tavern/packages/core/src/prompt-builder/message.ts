import type { CoreMessage } from 'ai'
import { convertToCoreMessages } from 'ai'

import type { ReducedMessage } from '../types'
import { TokenCounter } from './token-counter'

export class PromptMessage {
  constructor(
    readonly identifier: string,
    readonly message: ReducedMessage | CoreMessage,
    readonly tokens: number,
  ) {}

  static async fromContent(identifier: string, role: ReducedMessage['role'], content: string) {
    const message: CoreMessage = { role, content }

    const tokens = await TokenCounter.instance.count(identifier, message)

    return new PromptMessage(identifier, message, tokens)
  }

  static async fromMessage(identifier: string, message: ReducedMessage | CoreMessage) {
    const tokens = await TokenCounter.instance.count(identifier, message)

    return new PromptMessage(identifier, message, tokens)
  }

  getTokens() {
    return this.tokens
  }
}

export class PromptCollection {
  messages: PromptMessage[] = []

  constructor(readonly identifier: string) {}

  add(message: PromptMessage) {
    this.messages.push(message)
  }

  getTokens() {
    return this.messages.reduce((tokens, message) => tokens + message.getTokens(), 0)
  }

  has(identifier: string) {
    return this.messages.some((message) => message.identifier === identifier)
  }
}

export function isModelMessage(message: ReducedMessage | CoreMessage): message is CoreMessage {
  return !(message as ReducedMessage).content.parts
}

export function convertToModelMessages(message: ReducedMessage | CoreMessage) {
  return !isModelMessage(message)
    ? convertToCoreMessages([
        {
          role: message.role,
          ...message.content,
          content: '',
        },
      ])
    : [message]
}
