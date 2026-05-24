import { getRedis, getRedisWithoutCache } from '../redis.js'
import { GatewayOffloader } from './offloader.js'

const MIN_INTERVAL_MS = 5 * 60 * 1000

/**
 * Periodically removes Drizzle Gateway pods that have been idle for too long.
 */
export async function runOffloader(shutdownCheck: () => boolean): Promise<void> {
  const offloader = new GatewayOffloader()

  console.log(
    'Drizzgw offloader started. Checking idle gateways every',
    MIN_INTERVAL_MS / 1000,
    'seconds.',
  )

  try {
    while (!shutdownCheck()) {
      try {
        const hasMore = await offloader.findAndDeleteIdleGateways()
        if (hasMore) {
          continue
        }
      } catch (error) {
        console.error('Error in drizzgw offloader loop:', error)
        if (shutdownCheck()) {
          break
        }
      }

      const sleepStart = Date.now()
      while (Date.now() - sleepStart < MIN_INTERVAL_MS && !shutdownCheck()) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000)
        })
      }
    }
  } finally {
    console.log('Shutting down drizzgw offloader, closing connections...')
    try {
      const [redis, redisWithoutCache] = await Promise.all([getRedis(), getRedisWithoutCache()])
      await Promise.all([redis.close(), redisWithoutCache.close()])
      redis.destroy()
      redisWithoutCache.destroy()
    } catch (error) {
      console.error('Error closing Redis connections:', error)
    }
  }

  console.log('Drizzgw offloader stopped gracefully')
}
