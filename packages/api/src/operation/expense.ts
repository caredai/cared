import assert from 'assert'
import { Decimal } from 'decimal.js'

import type { GenerationDetails, ModelCallOptions, TypedModelInfo } from '@cared/providers'
import { eq, sql } from '@cared/db'
import { db } from '@cared/db/client'
import { Credits, Expense } from '@cared/db/schema'
import { RateLimiter } from '@cared/kv'
import { computeGenerationCost, estimateGenerationCost } from '@cared/providers'

import type { AuthContext } from '../auth'
import type { WaitUntil } from '../utils'
import { cfg } from '../config'
import { getCredits, triggerAutoRechargePaymentIntent, updateCreditsCache } from './credits'

let rateLimiter: Promise<RateLimiter> | undefined
async function getRateLimiter(): Promise<RateLimiter> {
  rateLimiter ??= RateLimiter.new({
    keyPrefix: 'aiFreeQuota',
    points: cfg.perUser.perDay.freeQuotaModelCalls, // Number of points
    duration: 60 * 60 * 24, // Per day
    insuranceLimiter: {
      points: cfg.perUser.perDay.freeQuotaModelCalls / 24,
      duration: 60 * 60,
    },
  })
  return rateLimiter
}

export class ExpenseManager {
  static from({ auth, waitUntil }: { auth: AuthContext; waitUntil: WaitUntil }) {
    return new ExpenseManager({
      accountId: auth.accountId,
      userId: 'userId' in auth ? auth.userId : undefined,
      appId: auth.type === 'appUser' ? auth.appId : undefined,
      waitUntil,
    })
  }

  private readonly userId?: string
  private readonly accountId: string
  private readonly appId?: string
  private readonly waitUntil: WaitUntil

  constructor({
    accountId,
    userId,
    appId,
    waitUntil,
  }: {
    accountId: string
    userId?: string
    appId?: string
    waitUntil: WaitUntil
  }) {
    this.accountId = accountId
    this.userId = userId
    this.appId = appId
    this.waitUntil = waitUntil
  }

  private creditsPromise?: Promise<Credits | undefined>

  private async getCredits() {
    this.creditsPromise ??= getCredits(this.accountId)
    return await this.creditsPromise
  }

  private hasFreeQuota_: boolean | undefined = undefined

  async hasFreeQuota(): Promise<boolean> {
    // Check only once per request
    if (this.hasFreeQuota_ === undefined) {
      try {
        await (await getRateLimiter()).consume(this.accountId, 1)
        this.hasFreeQuota_ = true
      } catch {
        this.hasFreeQuota_ = false
      }
    }
    return this.hasFreeQuota_
  }

  async canAfford(model: TypedModelInfo, callOptions: ModelCallOptions, byok?: boolean) {
    if (!model.chargeable && !byok) {
      throw new Error('Model is not chargeable')
    }

    const credits = await this.getCredits()
    if (!credits) {
      throw new Error('Credits not found')
    }
    if (new Decimal(credits.credits).isNegative()) {
      throw new Error('Negative credits')
    }

    const cost = estimateGenerationCost(model, callOptions)

    // If no cost
    if (!cost?.isPositive()) {
      if (!(await this.hasFreeQuota())) {
        throw new Error('Free quota exceeded')
      }
      return
    }

    if (new Decimal(credits.credits).gte(cost)) {
      return
    }

    throw new Error('Insufficient credits')
  }

  billGeneration(model: TypedModelInfo, details: GenerationDetails) {
    if (!model.chargeable && !details.byok) {
      throw new Error('Model is not chargeable')
    }

    this.waitUntil(async () => {
      const credits = await this.getCredits()
      if (!credits) {
        throw new Error('Credits not found')
      }
      if (new Decimal(credits.credits).isNegative()) {
        throw new Error('Negative credits')
      }

      let cost = computeGenerationCost(model, details)

      if (!cost?.isPositive()) {
        assert(this.hasFreeQuota())
        await db.insert(Expense).values({
          accountId: this.accountId,
          userId: this.userId,
          appId: this.appId,
          kind: 'generation',
          details,
        })

        return
      }

      // If byok, apply credits fee rate
      if (details.byok) {
        cost = cost.times(cfg.platform.creditsFeeRate).div(1 + cfg.platform.creditsFeeRate)
      }

      await db.insert(Expense).values({
        accountId: this.accountId,
        userId: this.userId,
        appId: this.appId,
        kind: 'generation',
        cost: cost.toString(),
        details,
      })

      const updatedCredits = (
        await db
          .update(Credits)
          .set({
            credits: sql`${Credits.credits} - ${cost.toString()}`,
          })
          .where(eq(Credits.id, credits.id))
          .returning()
      ).at(0)!

      credits.credits = updatedCredits.credits

      await updateCreditsCache(updatedCredits)

      await triggerAutoRechargePaymentIntent(updatedCredits)
    })
  }
}
