import assert from 'assert'
import type { ModelMessage } from 'ai'
import { convertToModelMessages as _convertToModelMessages } from 'ai'

import type { Prompt } from '../prompt'
import type { ReducedMessage } from '../types'
import { getMessageText } from '../message'
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

  getText() {
    if (isModelMessage(this.message)) {
      const content = this.message.content
      if (typeof content === 'string') {
        return content
      } else {
        return content
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('\n')
      }
    } else {
      return getMessageText(this.message)
    }
  }

  isEmpty() {
    if (isModelMessage(this.message)) {
      const content = this.message.content
      if (typeof content === 'string') {
        return !content.trim().length
      } else {
        return !content.some((part) => part.type !== 'text' || part.text.trim().length)
      }
    } else {
      return !this.message.content.parts.some(
        (part) => part.type !== 'text' || part.text.trim().length,
      )
    }
  }

  getTokens() {
    return this.tokens
  }
}

export class PromptCollection {
  messages: PromptMessage[] = []

  constructor(
    readonly identifier: string,
    readonly prompt?: Prompt,
  ) {}

  add(message: PromptMessage) {
    this.messages.push(message)
  }

  insert(message: PromptMessage, position: 'start' | 'end' | number = 'end') {
    if (typeof position === 'number' && position >= 0) {
      assert(!!this.messages[position], 'Position out of bounds')
      this.messages.splice(position, 0, message)
    } else if (position === 'start') {
      this.messages.unshift(message)
    } else {
      this.messages.push(message)
    }
  }

  getText() {
    return this.messages.map((message) => message.getText()).join('\n')
  }

  getTokens() {
    return this.messages.reduce((tokens, message) => tokens + message.getTokens(), 0)
  }

  has(identifier: string) {
    return this.messages.some((message) => message.identifier === identifier)
  }

  isEmpty() {
    return this.messages.length === 0 || this.messages.every((message) => message.isEmpty())
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
