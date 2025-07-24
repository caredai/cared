import assert from 'assert'

import type { PromptCollection, PromptMessage } from './message'
import { TokenBudgetExceededError } from './error'
import { convertToModelMessages } from './message'

export class ChatContext {
  collection: PromptCollection[] = []
  tokenBudget = 0

  setTokenBudget(maxPromptTokens: number) {
    this.tokenBudget = maxPromptTokens

    console.log(`Token budget: ${this.tokenBudget}`)
  }

  canAffordAll(messages: (PromptCollection | PromptMessage)[]) {
    return (
      this.tokenBudget - messages.reduce((total, message) => total + message.getTokens(), 0) >= 0
    )
  }

  canAfford(collectionOrMessage: PromptCollection | PromptMessage) {
    return this.tokenBudget - collectionOrMessage.getTokens() >= 0
  }

  checkTokenBudget(collectionOrMessage: PromptCollection | PromptMessage) {
    if (!this.canAfford(collectionOrMessage)) {
      throw new TokenBudgetExceededError(collectionOrMessage.identifier)
    }
  }

  decreaseTokenBudgetBy(tokens: number) {
    this.tokenBudget -= tokens
  }

  increaseTokenBudgetBy(tokens: number) {
    this.tokenBudget += tokens
  }

  reserveBudget(message: PromptMessage | PromptCollection | number) {
    const tokens = typeof message === 'number' ? message : message.getTokens()
    this.decreaseTokenBudgetBy(tokens)
  }

  freeBudget(message: PromptMessage | PromptCollection | number) {
    const tokens = typeof message === 'number' ? message : message.getTokens()
    this.increaseTokenBudgetBy(tokens)
  }

  getTokens() {
    return this.collection.reduce((total, collection) => total + collection.getTokens(), 0)
  }

  insertCollection(collection: PromptCollection, position?: number) {
    this.checkTokenBudget(collection)

    if (typeof position === 'number' && position >= 0) {
      assert(!!this.collection[position], 'Position out of bounds')
      this.collection.splice(position, 0, collection)
    } else {
      this.collection.push(collection)
    }

    this.decreaseTokenBudgetBy(collection.getTokens())

    console.log(`Added ${collection.identifier}. Remaining tokens: ${this.tokenBudget}`)
  }

  insertMessage(
    message: PromptMessage,
    identifier: string,
    position: 'start' | 'end' | number = 'end',
  ) {
    this.checkTokenBudget(message)

    const collection = this.collection.find((c) => c.identifier === identifier)
    if (!collection) {
      throw new Error(`Message collection with identifier ${identifier} not found`)
    }

    collection.insert(message, position)

    this.decreaseTokenBudgetBy(message.tokens)
  }

  hasMessage(identifier: string) {
    return this.collection.some((c) => c.has(identifier))
  }

  getModelMessages() {
    const messages = []
    for (const collection of this.collection) {
      messages.push(...collection.messages.map((m) => convertToModelMessages(m.message).at(0)!))
    }
    return messages
  }
}
