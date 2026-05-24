import { createHash, randomBytes } from 'node:crypto'

import { getRedisWithoutCache, lockKey } from '../redis.js'
import { RELEASE_LOCK_SCRIPT, RENEW_LOCK_SCRIPT } from './lua-script.js'

export const LOCK_TTL_SECONDS = 120
const LOCK_RENEWAL_THRESHOLD = 0.8
const LOCK_RENEWAL_CHECK_INTERVAL_MS = 10_000

/**
 * Redis lock with Lua-based release and renewal.
 */
export class RedisLock {
  #releaseLockScriptHash?: string
  #renewLockScriptHash?: string

  private get releaseLockScriptHash() {
    this.#releaseLockScriptHash ??= createHash('sha1').update(RELEASE_LOCK_SCRIPT).digest('hex')
    return this.#releaseLockScriptHash
  }

  private get renewLockScriptHash() {
    this.#renewLockScriptHash ??= createHash('sha1').update(RENEW_LOCK_SCRIPT).digest('hex')
    return this.#renewLockScriptHash
  }

  async acquire(resourceKey: string, ttlSeconds = LOCK_TTL_SECONDS): Promise<string | false> {
    const redis = await getRedisWithoutCache()
    const lockValue = randomBytes(16).toString('hex')
    const result = await redis.set(lockKey(resourceKey), lockValue, {
      NX: true,
      EX: ttlSeconds,
    })
    return result === 'OK' ? lockValue : false
  }

  async release(resourceKey: string, lockValue: string): Promise<void> {
    const redis = await getRedisWithoutCache()
    const key = lockKey(resourceKey)

    try {
      await redis.evalSha(this.releaseLockScriptHash, {
        keys: [key],
        arguments: [lockValue],
      })
    } catch (error) {
      if (error?.toString().includes('NOSCRIPT')) {
        await redis.eval(RELEASE_LOCK_SCRIPT, {
          keys: [key],
          arguments: [lockValue],
        })
      }
    }
  }

  async renew(
    resourceKey: string,
    lockValue: string,
    ttlSeconds = LOCK_TTL_SECONDS,
  ): Promise<boolean> {
    const redis = await getRedisWithoutCache()
    const key = lockKey(resourceKey)

    try {
      const result = await redis.evalSha(this.renewLockScriptHash, {
        keys: [key],
        arguments: [lockValue, ttlSeconds.toString()],
      })
      return result === 1
    } catch (error) {
      if (error?.toString().includes('NOSCRIPT')) {
        const result = await redis.eval(RENEW_LOCK_SCRIPT, {
          keys: [key],
          arguments: [lockValue, ttlSeconds.toString()],
        })
        return result === 1
      }
      return false
    }
  }

  /**
   * Runs an operation while periodically renewing the lock for long-running work.
   */
  async withRenewal<T>(
    resourceKey: string,
    lockValue: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const lockStartTime = performance.now()
    let operationCompleted = false

    const renewalChecker = (async () => {
      while (!operationCompleted) {
        await new Promise((resolve) => setTimeout(resolve, LOCK_RENEWAL_CHECK_INTERVAL_MS))
        const elapsedSeconds = (performance.now() - lockStartTime) / 1000
        if (elapsedSeconds >= LOCK_TTL_SECONDS * LOCK_RENEWAL_THRESHOLD) {
          await this.renew(resourceKey, lockValue)
        }
      }
    })()

    try {
      return await operation()
    } finally {
      operationCompleted = true
      await renewalChecker.catch(() => undefined)
    }
  }
}

export const branchLock = new RedisLock()

export async function waitWithExponentialBackoff(
  retryAttempt: number,
  baseDelayMs = 200,
): Promise<void> {
  const delayMs = baseDelayMs * 2 ** retryAttempt
  await new Promise((resolve) => setTimeout(resolve, delayMs + Math.random() * delayMs * 0.3))
}
