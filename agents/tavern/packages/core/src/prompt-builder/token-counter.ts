import type { ModelMessage } from 'ai'

import type { ReducedMessage } from '../types'
import { convertToModelMessages } from './message'

export class TokenCounter {
  counts = new Map<string, number>()

  constructor(public countTokens: (text: string) => Promise<number>) {}

  reset() {
    this.counts.clear()
  }

  async count(type: string, message: string | ReducedMessage | ModelMessage): Promise<number> {
    let text: string
    if (typeof message !== 'string') {
      const coreMessages = convertToModelMessages(message)
      text = JSON.stringify(coreMessages)
    } else {
      text = message
    }

    const previous = this.counts.get(type) ?? 0

    const count = await this.countTokens(text)

    this.counts.set(text, previous + count)

    return count
  }

  total() {
    let total = 0
    for (const count of this.counts.values()) {
      total += count
    }
    return total
  }

  static instance: TokenCounter

  static setup(countTokens: (text: string) => Promise<number>) {
    TokenCounter.instance = new TokenCounter(countTokens)
    return TokenCounter.instance
  }
}
