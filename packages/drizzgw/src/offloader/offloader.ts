import { env } from '../env.js'
import { getMinutesSinceEpoch } from '../gateway/access.js'
import { deleteGatewayPod, getPodName } from '../gateway/k8s.js'
import { branchLock, waitWithExponentialBackoff } from '../lock/lock.js'
import { ACCESS_TIME_KEY, getRedis } from '../redis.js'

const MAX_PARALLEL_DELETES = 10
const MAX_RETRY_ATTEMPTS = 3

export class GatewayOffloader {
  async deleteIdleGateway(branchKey: string, retryAttempt = 0): Promise<void> {
    const lockValue = await branchLock.acquire(branchKey)
    if (!lockValue) {
      if (retryAttempt >= MAX_RETRY_ATTEMPTS) {
        console.warn(`Could not acquire lock to delete gateway ${branchKey}`)
        return
      }
      await waitWithExponentialBackoff(retryAttempt, 1000)
      return this.deleteIdleGateway(branchKey, retryAttempt + 1)
    }

    try {
      const redis = await getRedis()
      const nowInMinutes = getMinutesSinceEpoch()
      const idleThreshold = nowInMinutes - env.MAX_IDLE_MINUTES
      const lastAccess = await redis.zScore(ACCESS_TIME_KEY, branchKey)

      if (lastAccess !== null && lastAccess >= idleThreshold) {
        console.log(`Gateway ${branchKey} was accessed recently. Skipping delete.`)
        return
      }

      const podName = getPodName(branchKey)
      await deleteGatewayPod(podName, branchKey)
      await redis.zRem(ACCESS_TIME_KEY, branchKey)
      console.log(`Deleted idle gateway pod for ${branchKey}`)
    } finally {
      await branchLock.release(branchKey, lockValue)
    }
  }

  /**
   * Finds idle gateways and deletes their Kubernetes resources.
   * @returns true when more idle gateways may remain
   */
  async findAndDeleteIdleGateways(): Promise<boolean> {
    const redis = await getRedis()
    const nowInMinutes = getMinutesSinceEpoch()
    const idleThreshold = nowInMinutes - env.MAX_IDLE_MINUTES

    const toProcess = await redis.zRangeByScore(ACCESS_TIME_KEY, 0, idleThreshold, {
      LIMIT: { offset: 0, count: MAX_PARALLEL_DELETES },
    })
    console.log(`Checking idle gateways: ${toProcess.join(', ') || '(none)'}`)

    await Promise.all(
      toProcess.map(async (branchKey) => {
        try {
          await this.deleteIdleGateway(branchKey)
        } catch (error) {
          console.error(`Error deleting idle gateway ${branchKey}:`, error)
        }
      }),
    )

    return toProcess.length >= MAX_PARALLEL_DELETES
  }
}
