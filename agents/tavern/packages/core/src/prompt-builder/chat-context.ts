import assert from 'assert'
import type { ModelMessage, SystemModelMessage } from 'ai'

import type { PromptCollection, PromptMessage } from './message'
import { TokenBudgetExceededError } from './error'
import { convertToModelMessages } from './message'

export class ChatContext {
  collections: PromptCollection[] = []
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
    return this.collections.reduce((total, collection) => total + collection.getTokens(), 0)
  }

  insertCollection(collection: PromptCollection, position?: number) {
    this.checkTokenBudget(collection)

    if (typeof position === 'number' && position >= 0) {
      assert(!!this.collections[position], 'Position out of bounds')
      this.collections.splice(position, 0, collection)
    } else {
      this.collections.push(collection)
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

    const collection = this.collections.find((c) => c.identifier === identifier)
    if (!collection) {
      throw new Error(`Message collection with identifier ${identifier} not found`)
    }

    collection.insert(message, position)

    this.decreaseTokenBudgetBy(message.tokens)
  }

  hasMessage(identifier: string) {
    return this.collections.some((c) => c.has(identifier))
  }

  getModelMessages(squashSystemMessages?: boolean): ModelMessage[] {
    const messages: (ModelMessage & {
      identifier: string
    })[] = []
    for (const collection of this.collections) {
      if (collection.prompt && !collection.prompt.enabled) {
        continue
      }
      messages.push(
        ...collection.messages
          .filter((m) => !m.isEmpty())
          .flatMap((m) =>
            convertToModelMessages(m.message).map((msg) => ({
              ...msg,
              identifier: m.identifier,
            })),
          ),
      )
    }
    if (!squashSystemMessages) {
      return messages
    }

    const excludeList = ['newMainChat', 'newChat', 'groupNudge']

    const shouldSquash = (
      message: (typeof messages)[number],
    ): message is SystemModelMessage & {
      identifier: string
    } => {
      return !excludeList.includes(message.identifier) && message.role === 'system'
    }

    const squashedMessages = []
    let lastMessage:
      | (ModelMessage & {
          identifier: string
        })
      | undefined = undefined
    for (const message of messages) {
      if (shouldSquash(message)) {
        if (lastMessage && shouldSquash(lastMessage)) {
          lastMessage.content += '\n' + message.content
          continue
        }
      }

      squashedMessages.push(message)
      lastMessage = message
    }

    return squashedMessages
  }

  log() {
    // Define ANSI color codes for better readability
    const RESET = '\x1b[0m'
    // Background color codes
    const BG_CYAN = '\x1b[46m'
    const BG_YELLOW = '\x1b[43m'
    const BG_GREEN = '\x1b[42m'
    const BG_MAGENTA = '\x1b[45m'
    const BG_BLUE = '\x1b[44m'
    const BG_RED = '\x1b[41m'
    // Foreground color for contrast
    const FG_BLACK = '\x1b[30m'
    const FG_WHITE = '\x1b[97m'

    console.log(`${BG_CYAN}${FG_BLACK} Chat context: ${RESET}`)
    let i = 0
    for (const collection of this.collections) {
      console.log(
        `${BG_YELLOW}${FG_BLACK} Prompt collection #${++i}: ${RESET} ${BG_GREEN}${FG_BLACK} ${collection.identifier} ${RESET}`,
      )
      let j = 0
      for (const message of collection.messages) {
        console.log(
          `${BG_MAGENTA}${FG_WHITE} Prompt identifier #${++j}: ${RESET} ${BG_BLUE}${FG_WHITE} ${message.identifier} ${RESET}, ${BG_RED}${FG_WHITE} tokens: ${message.tokens} ${RESET}, message: ${JSON.stringify(convertToModelMessages(message.message), null, 2)}`,
        )
      }
    }
  }
}
