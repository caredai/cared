import type { ModelMessage } from 'ai'
import { convertToModelMessages as _convertToModelMessages } from 'ai'

import type { ReducedMessage } from '../types'
import { TokenCounter } from './token-counter'

export class PromptMessage {
  constructor(
    readonly identifier: string,
    readonly message: ReducedMessage | ModelMessage,
    readonly tokens: number,
  ) {}

  static async fromContent(identifier: string, role: ReducedMessage['role'], content: string) {
    const message: ModelMessage = { role, content }

    const tokens = await TokenCounter.instance.count(identifier, message)

    return new PromptMessage(identifier, message, tokens)
  }

  static async fromMessage(identifier: string, message: ReducedMessage | ModelMessage) {
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

export function isModelMessage(message: ReducedMessage | ModelMessage): message is ModelMessage {
  return !(message as ReducedMessage).content.parts
}

export function convertToModelMessages(message: ReducedMessage | ModelMessage) {
  return !isModelMessage(message)
    ? _convertToModelMessages([
        {
          role: message.role,
          ...message.content,
        },
      ])
    : [message]
}
