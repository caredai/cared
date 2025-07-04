export class TokenBudgetExceededError extends Error {
  constructor(identifier: string) {
    super(`Token budged exceeded: message '${identifier}'`)
    this.name = 'TokenBudgetExceeded'
  }
}
