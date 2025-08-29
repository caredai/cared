import assert from 'assert'
import { Decimal } from 'decimal.js'

import type {
  GenerationDetailsByType,
  GenerationDetails,
  ModelCallOptions,
  ModelInfos,
  ModelType,
} from '@cared/providers'
import { and, desc, eq, sql } from '@cared/db'
import { db } from '@cared/db/client'
import { Credits, Expense, Member, Organization } from '@cared/db/schema'
import { computeGenerationCost, estimateGenerationCost } from '@cared/providers'
import { getKV } from '@cared/kv'

import type { AuthObject } from '@/auth'

const kv = getKV('expense', 'upstash')

export class ExpenseManager {
  static from({ auth, payerOrganizationId }: { auth: AuthObject; payerOrganizationId?: string }) {
    if (auth.type === 'user') {
      return new ExpenseManager({
        userId: auth.userId,
        organizationId: payerOrganizationId,
      })
    } else {
      if (payerOrganizationId) {
        throw new Error('Cannot use payerOrganizationId with non-user auth')
      }

      if (auth.type === 'appUser' || auth.scope === 'user') {
        return new ExpenseManager({
          userId: auth.userId,
          appId: auth.type === 'appUser' ? auth.appId : undefined,
        })
      } else {
        return new ExpenseManager({
          userId: auth.ownerId, // as member of organization
          organizationId: auth.organizationId,
          appId: auth.scope === 'app' ? auth.appId : undefined,
        })
      }
    }
  }

  private readonly userId: string
  private readonly organizationId?: string
  private readonly appId?: string

  constructor({
    userId,
    organizationId,
    appId,
  }: {
    userId: string
    organizationId?: string
    appId?: string
  }) {
    this.userId = userId
    this.organizationId = organizationId
    this.appId = appId
  }

  private creditsCandidates?: Credits[]

  private async prepare() {
    if (this.creditsCandidates) {
      return this.creditsCandidates
    }

    this.creditsCandidates = []

    if (this.organizationId) {
      const credits = await db
        .select({
          credits: Credits,
        })
        .from(Member)
        .innerJoin(Credits, eq(Credits.organizationId, Member.organizationId))
        .where(and(eq(Member.userId, this.userId), eq(Member.organizationId, this.organizationId)))
        .then((creditsArray) => creditsArray.at(0)?.credits)
      if (credits) {
        this.creditsCandidates.push(credits)
      }
    } else {
      const creditsArray: Credits[] = (
        await Promise.all([
          db.query.Credits.findMany({
            where: eq(Credits.userId, this.userId),
          }),
          db
            .select({
              credits: Credits,
            })
            .from(Member)
            .innerJoin(Organization, eq(Member.organizationId, Organization.id))
            .innerJoin(Credits, eq(Credits.organizationId, Organization.id))
            .where(eq(Member.userId, this.userId))
            .orderBy(desc(Credits.id))
            .then((creditsArray) => creditsArray.map(({ credits }) => credits)),
        ])
      ).flat()

      this.creditsCandidates.push(...creditsArray)
    }

    return this.creditsCandidates
  }

  async canAfford<T extends ModelType, K extends `${T}Models`>(
    type: T,
    model: NonNullable<ModelInfos[K]>[number],
    callOptions: GenerationDetailsByType<ModelCallOptions, T>,
    byok?: boolean,
  ) {
    const creditsCandidates = await this.prepare()
    if (creditsCandidates.some((credits) => new Decimal(credits.credits).isNegative())) {
      throw new Error('Negative credits')
    }

    const cost = estimateGenerationCost(type, model, callOptions)
    if (byok || !cost?.isPositive()) {
      return
    }

    for (const credits of creditsCandidates) {
      if (new Decimal(credits.credits).gte(cost)) {
        return
      }
    }

    throw new Error('Insufficient credits')
  }

  private async waitUntil(cb: () => Promise<void>) {
    // TODO: use cloudflare ctx.waitUntil()
    await cb()
  }

  async billGeneration<T extends ModelType, K extends `${T}Models`>(
    type: T,
    model: NonNullable<ModelInfos[K]>[number],
    details: GenerationDetailsByType<GenerationDetails, T>,
  ) {
    await this.waitUntil(async () => {
      const creditsCandidates = await this.prepare()

      if (creditsCandidates.some((credits) => new Decimal(credits.credits).isNegative())) {
        throw new Error('Negative credits')
      }

      const cost = computeGenerationCost(type, model, details)
      if (details.byok || !cost?.isPositive()) {
        await db.insert(Expense).values({
          type: 'user',
          userId: this.userId,
          appId: this.appId,
          kind: 'generation',
          details,
        })

        return
      }

      if (!creditsCandidates.length) {
        throw new Error('No credits available')
      }

      let maxCredits: Credits | undefined
      for (const credits of creditsCandidates) {
        if (!maxCredits || new Decimal(credits.credits).gt(maxCredits.credits)) {
          maxCredits = credits
        }

        if (new Decimal(credits.credits).lt(cost)) {
          continue
        }

        await db.insert(Expense).values({
          type: credits.type,
          userId: credits.type === 'user' ? credits.userId! : this.userId,
          organizationId: credits.organizationId,
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

        return
      }

      assert(maxCredits, 'maxCredits should be defined if creditsCandidates is not empty')

      await db.insert(Expense).values({
        type: maxCredits.type,
        userId: maxCredits.type === 'user' ? maxCredits.userId! : this.userId,
        organizationId: maxCredits.organizationId,
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
          .where(eq(Credits.id, maxCredits.id))
          .returning()
      ).at(0)!

      maxCredits.credits = updatedCredits.credits
    })
  }
}
