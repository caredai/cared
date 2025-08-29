import type { ModelFullId, ProviderId, ProviderKey as ProviderKeyContent } from '@cared/providers'
import { and, desc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { ProviderKey } from '@cared/db/schema'
import { getKV } from '@cared/kv'
import { splitModelFullId } from '@cared/providers'

import type { AuthObject } from '../../auth'
import { decryptProviderKey } from './encryption'

const kv = getKV('providerKey', 'upstash')

export class ProviderKeyManager {
  constructor(
    private auth: AuthObject,
    private modelFullId: ModelFullId,
    private providerId: ProviderId,
    private modelId: string,
    private systemKeys: ProviderKeyStatus[],
    private userOrOrgKeys: ProviderKeyStatus[],
    private byok: boolean,
  ) {}

  static async from({
    auth,
    modelId: modelFullId,
    byok,
  }: {
    auth: AuthObject
    modelId: ModelFullId
    byok: boolean
  }) {
    const { providerId, modelId } = splitModelFullId(modelFullId)

    const [systemKeysStatusStr, userOrOrgKeysStatusStr] = await Promise.all([
      !byok ? kv.get(systemKeysStatusKey(modelFullId)) : null,
      kv.get(userOrOrgKeysStatusKey(auth, modelFullId)),
    ])

    let systemKeysStatus: ProviderKeyStatus[] | null =
      systemKeysStatusStr && JSON.parse(systemKeysStatusStr)
    let userOrOrgKeysStatus: ProviderKeyStatus[] | null =
      userOrOrgKeysStatusStr && JSON.parse(userOrOrgKeysStatusStr)

    if (!systemKeysStatus) {
      if (!byok) {
        const keys = await db
          .select()
          .from(ProviderKey)
          .where(and(eq(ProviderKey.providerId, providerId), eq(ProviderKey.isSystem, true)))
          .orderBy(desc(ProviderKey.id))

        systemKeysStatus = keys.map((k) => ({
          id: k.id,
          byok: !!k.isSystem,
          key: k.key,
          disabled: k.disabled,
        }))
      } else {
        systemKeysStatus = []
      }
    }

    if (!userOrOrgKeysStatus) {
      const keys = await db
        .select()
        .from(ProviderKey)
        .where(
          and(
            eq(ProviderKey.providerId, providerId),
            auth.type === 'user' || auth.type === 'appUser' || auth.scope === 'user'
              ? eq(ProviderKey.userId, auth.userId)
              : eq(ProviderKey.organizationId, auth.organizationId),
          ),
        )
        .orderBy(desc(ProviderKey.id))

      userOrOrgKeysStatus = keys.map((k) => ({
        id: k.id,
        byok: !!k.isSystem,
        key: k.key,
        disabled: k.disabled,
      }))
    }

    return new ProviderKeyManager(
      auth,
      modelFullId,
      providerId,
      modelId,
      await Promise.all(
        systemKeysStatus.map(async (k) => ({
          ...k,
          key: await decryptProviderKey(k.key, true),
        })),
      ),
      await Promise.all(
        userOrOrgKeysStatus.map(async (k) => ({
          ...k,
          key: await decryptProviderKey(k.key, true),
        })),
      ),
      byok,
    )
  }

  /**
   * Select available keys based on their current status and health.
   * Implements intelligent key selection considering:
   * - Key availability (not disabled)
   * - Failure count and health status
   * - Rate limit status
   * - Last usage time for load balancing
   * - Priority (system keys first, then user/org keys)
   */
  selectKeys(strategy: ProviderKeyStrategy = 'hybrid'): ProviderKeyStatus[] {
    const availableSystemKeys = this.systemKeys.filter((k) => !k.disabled)
    const availableUserOrOrgKeys = this.userOrOrgKeys.filter((k) => !k.disabled)

    if (!this.byok) {
      // Combine system and user/org keys, prioritizing user/org keys
      return [
        ...this.selectKeys_(strategy, availableUserOrOrgKeys),
        ...this.selectKeys_(strategy, availableSystemKeys),
      ]
    } else {
      return this.selectKeys_(strategy, availableUserOrOrgKeys)
    }
  }

  private selectKeys_(strategy: ProviderKeyStrategy, availableKeys: ProviderKeyStatus[]) {
    switch (strategy) {
      case 'random':
        return this.selectRandomKeys(availableKeys)
      case 'round-robin':
        return this.selectRoundRobinKeys(availableKeys)
      case 'weighted-round-robin':
        return this.selectWeightedRoundRobinKeys(availableKeys)
      case 'failover':
        return this.selectFailoverKeys(availableKeys)
      case 'rate-limit':
        return this.selectRateLimitKeys(availableKeys)
      case 'hybrid':
      default:
        return this.selectHybridKeys(availableKeys)
    }
  }

  /**
   * Select keys randomly from available pool
   */
  private selectRandomKeys(availableKeys: ProviderKeyStatus[]): ProviderKeyStatus[] {
    return availableKeys.sort(() => Math.random() - 0.5)
  }

  /**
   * Select keys in round-robin fashion based on last usage time
   */
  private selectRoundRobinKeys(availableKeys: ProviderKeyStatus[]): ProviderKeyStatus[] {
    return availableKeys.sort((a, b) => {
      const aTime = a.lastUsedAt ?? 0
      const bTime = b.lastUsedAt ?? 0
      return aTime - bTime
    })
  }

  /**
   * Select keys using weighted round-robin based on health and rate limit status
   */
  private selectWeightedRoundRobinKeys(availableKeys: ProviderKeyStatus[]): ProviderKeyStatus[] {
    return availableKeys.sort((a, b) => {
      // Calculate health score (lower is better)
      const aHealthScore = this.calculateHealthScore(a)
      const bHealthScore = this.calculateHealthScore(b)

      // Calculate rate limit score (higher remaining quota is better)
      const aRateScore = this.calculateRateLimitScore(a)
      const bRateScore = this.calculateRateLimitScore(b)

      // Combine scores (health is more important than rate limit)
      const aTotalScore = aHealthScore * 0.7 + aRateScore * 0.3
      const bTotalScore = bHealthScore * 0.7 + bRateScore * 0.3

      return aTotalScore - bTotalScore
    })
  }

  /**
   * Select keys using failover strategy (healthiest keys first)
   */
  private selectFailoverKeys(availableKeys: ProviderKeyStatus[]): ProviderKeyStatus[] {
    return availableKeys.sort((a, b) => {
      const aHealthScore = this.calculateHealthScore(a)
      const bHealthScore = this.calculateHealthScore(b)
      return aHealthScore - bHealthScore
    })
  }

  /**
   * Select keys prioritizing those with available rate limits
   */
  private selectRateLimitKeys(availableKeys: ProviderKeyStatus[]): ProviderKeyStatus[] {
    return availableKeys.sort((a, b) => {
      const aRateScore = this.calculateRateLimitScore(a)
      const bRateScore = this.calculateRateLimitScore(b)
      return bRateScore - aRateScore // Higher score first
    })
  }

  /**
   * Hybrid strategy combining multiple factors for optimal key selection
   */
  private selectHybridKeys(availableKeys: ProviderKeyStatus[]): ProviderKeyStatus[] {
    return availableKeys.sort((a, b) => {
      // Calculate comprehensive score
      const aScore = this.calculateComprehensiveScore(a)
      const bScore = this.calculateComprehensiveScore(b)
      return bScore - aScore // Higher score first
    })
  }

  /**
   * Calculate health score based on failure count and last failure time
   * Lower score means healthier key
   */
  private calculateHealthScore(key: ProviderKeyStatus): number {
    let score = 0

    // Failure count penalty (exponential)
    if (key.failureCount && key.failureCount > 0) {
      score += Math.pow(2, key.failureCount - 1) * 10
    }

    // Recent failure penalty (decays over time)
    if (key.lastFailureAt) {
      const timeSinceFailure = now() - key.lastFailureAt
      const hoursSinceFailure = timeSinceFailure / 3600
      if (hoursSinceFailure < 24) {
        score += (24 - hoursSinceFailure) * 2 // Recent failures get higher penalty
      }
    }

    return score
  }

  /**
   * Calculate rate limit score based on remaining quotas
   * Higher score means more available capacity
   */
  private calculateRateLimitScore(key: ProviderKeyStatus): number {
    let score = 0

    // Request quota score
    if (key.rateLimitRemainingRequests !== undefined) {
      score += key.rateLimitRemainingRequests * 0.1
    }

    // Token quota score
    if (key.rateLimitRemainingTokens !== undefined) {
      score += key.rateLimitRemainingTokens * 0.001 // Tokens are typically much larger numbers
    }

    // Reset time bonus (closer to reset means more capacity soon)
    if (key.rateLimitResetRequestsAt) {
      const timeToReset = key.rateLimitResetRequestsAt - now()
      if (timeToReset > 0 && timeToReset < 3600) {
        // Within next hour
        score += (3600 - timeToReset) * 0.01
      }
    }

    return score
  }

  /**
   * Calculate comprehensive score combining all factors
   * Higher score means better key choice
   */
  private calculateComprehensiveScore(key: ProviderKeyStatus): number {
    const healthScore = this.calculateHealthScore(key)
    const rateScore = this.calculateRateLimitScore(key)
    const timeScore = this.calculateTimeScore(key)
    const priorityScore = this.calculatePriorityScore(key)

    // Normalize and combine scores
    const normalizedHealthScore = Math.max(0, 100 - healthScore) // Convert to 0-100 scale
    const normalizedRateScore = Math.min(100, rateScore) // Cap at 100
    const normalizedTimeScore = timeScore
    const normalizedPriorityScore = priorityScore

    // Weighted combination
    return (
      normalizedHealthScore * 0.4 + // Health is most important
      normalizedRateScore * 0.3 + // Rate limit capacity
      normalizedTimeScore * 0.2 + // Load balancing
      normalizedPriorityScore * 0.1 // System vs user priority
    )
  }

  /**
   * Calculate time-based score for load balancing
   * Higher score for keys that haven't been used recently
   */
  private calculateTimeScore(key: ProviderKeyStatus): number {
    if (!key.lastUsedAt) {
      return 100 // Never used keys get highest score
    }

    const timeSinceLastUse = now() - key.lastUsedAt
    const hoursSinceLastUse = timeSinceLastUse / 3600

    // Score decreases over time, but not too aggressively
    return Math.max(0, 100 - hoursSinceLastUse * 2)
  }

  /**
   * Calculate priority score (system keys get slight priority)
   */
  private calculatePriorityScore(key: ProviderKeyStatus): number {
    return key.byok ? 10 : 0 // System keys get slight bonus
  }

  private findKey(id: string) {
    return [...this.systemKeys, ...this.userOrOrgKeys].find((k) => k.id === id)
  }

  recordSuccess(keyId: string) {
    const key = this.findKey(keyId)
    if (key) {
      key.lastUsedAt = now()
    }
  }

  recordFailure(keyId: string) {
    const key = this.findKey(keyId)
    if (key) {
      key.failureCount = (key.failureCount ?? 0) + 1
      key.lastFailureAt = now()
      key.lastUsedAt = now()
    }
  }

  recordRateLimit(
    keyId: string,
    rateLimit: {
      remainingRequests?: number
      resetRequestsAt?: number
      remainingTokens?: number
      resetTokensAt?: number
    },
  ) {
    const key = this.findKey(keyId)
    if (key) {
      if (rateLimit.remainingRequests !== undefined) {
        key.rateLimitRemainingRequests = rateLimit.remainingRequests
      }
      if (rateLimit.resetRequestsAt !== undefined) {
        key.rateLimitResetRequestsAt = rateLimit.resetRequestsAt
      }
      if (rateLimit.remainingTokens !== undefined) {
        key.rateLimitRemainingTokens = rateLimit.remainingTokens
      }
      if (rateLimit.resetTokensAt !== undefined) {
        key.rateLimitResetTokensAt = rateLimit.resetTokensAt
      }
      key.lastUsedAt = now()
    }
  }

  async save() {
    await Promise.all([
      !this.byok
        ? kv.set(systemKeysStatusKey(this.modelFullId), JSON.stringify(this.systemKeys))
        : undefined,
      kv.set(
        userOrOrgKeysStatusKey(this.auth, this.modelFullId),
        JSON.stringify(this.userOrOrgKeys),
      ),
    ])
  }
}

export type ProviderKeyStrategy =
  | 'random'
  | 'round-robin'
  | 'weighted-round-robin'
  | 'failover'
  | 'rate-limit'
  | 'hybrid'

function systemKeysStatusKey(modelId: ModelFullId) {
  return providerKeyStatusKey({ isSystem: true, modelId })
}

function userOrOrgKeysStatusKey(auth: AuthObject, modelId: ModelFullId) {
  return providerKeyStatusKey({
    userId:
      auth.type === 'user' || auth.type === 'appUser' || auth.scope === 'user'
        ? auth.userId
        : undefined,
    organizationId: !(auth.type === 'user' || auth.type === 'appUser' || auth.scope === 'user')
      ? auth.organizationId
      : undefined,
    modelId,
  })
}

function providerKeyStatusKey({
  isSystem,
  userId,
  organizationId,
  modelId,
}: {
  isSystem?: boolean
  userId?: string | null
  organizationId?: string | null
  modelId: ModelFullId
}) {
  if (isSystem) {
    return `system:${modelId}:status`
  } else if (userId) {
    return `${userId}:${modelId}:status`
  } else {
    return `${organizationId!}:${modelId}:status`
  }
}

export interface ProviderKeyStatus {
  /**
   * Unique identifier for the Key.
   */
  id: string

  /**
   * Whether the Key is a byok Key.
   */
  byok: boolean

  /**
   * Encrypted or decrypted Key value.
   */
  key: ProviderKeyContent

  /**
   * Whether the Key is disabled.
   */
  disabled: boolean

  /**
   * Consecutive failure count. The Key may be marked unhealthy if this exceeds a threshold.
   */
  failureCount?: number

  /**
   * Unix Epoch timestamp of the last failure occurrence.
   */
  lastFailureAt?: number

  /**
   * Remaining requests quota (parsed from API response headers).
   */
  rateLimitRemainingRequests?: number

  /**
   * Unix Epoch timestamp when the request quota will reset.
   */
  rateLimitResetRequestsAt?: number

  /**
   * Remaining token quota (parsed from API response headers).
   */
  rateLimitRemainingTokens?: number

  /**
   * Unix Epoch timestamp when the token quota will reset.
   */
  rateLimitResetTokensAt?: number

  /**
   * Unix Epoch timestamp of the last time this Key was used.
   * Can be used for LRU (Least Recently Used) or other time-based strategies.
   */
  lastUsedAt?: number
}

function now() {
  return Math.floor(Date.now() / 1000)
}
