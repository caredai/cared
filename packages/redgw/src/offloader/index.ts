import { getRedis } from '../client.js'
import { GraphOffloader } from './graph.js'

// Minimum interval between offload checks (5 minutes)
const MIN_INTERVAL_MS = 5 * 60 * 1000

/**
 * Runs the graph offloader in a continuous loop.
 * Periodically checks for idle graphs and offloads them to S3.
 * The function will run until shutdown is requested via the shutdownCheck callback.
 *
 * @param shutdownCheck - Function that returns true when shutdown is requested
 */
export async function runOffloader(shutdownCheck: () => boolean): Promise<void> {
  const offloader = new GraphOffloader()
  await offloader.init()

  console.log(
    'Graph offloader started. Checking for idle graphs every',
    MIN_INTERVAL_MS / 1000,
    'seconds.',
  )

  try {
    while (!shutdownCheck()) {
      try {
        const hasMoreIdles = await offloader.findAndOffloadIdleGraphs()
        if (hasMoreIdles) {
          // There are more idle graphs, so we continue the loop.
          continue
        }
      } catch (error) {
        console.error('Error in offloader loop:', error)
        // Continue running even if there's an error, unless shutdown is requested
        if (shutdownCheck()) {
          break
        }
      }

      // No more idle graphs, so we sleep for the minimum interval.
      // Check shutdown status periodically during sleep
      const sleepStart = Date.now()
      while (Date.now() - sleepStart < MIN_INTERVAL_MS && !shutdownCheck()) {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve()
          }, 1000) // Check every second
        })
      }
    }
  } finally {
    // Cleanup: close Redis connections
    console.log('Shutting down offloader, closing connections...')
    try {
      const redis = await getRedis()
      await redis.close()
      redis.destroy()
    } catch (error) {
      console.error('Error closing Redis connections:', error)
    }
  }

  console.log('Offloader stopped gracefully')
}
