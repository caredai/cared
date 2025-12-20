import { createHash, randomBytes } from 'node:crypto'
import { RESP_TYPES } from 'redis'
import sanitize from 'sanitize-filename'

import { getRedis } from '../client.js'
import { deleteFromS3, downloadFromS3, uploadToS3 } from '../s3.js'
import {
  CHECK_STATUS_AND_REFRESH_ACCESS_SCRIPT,
  RELEASE_LOCK_SCRIPT,
  RENEW_LOCK_SCRIPT,
} from './lua-script.js'

const MAX_IDLE_HOURS = 12
const MAX_PARALLEL_DUMPS = 10
// Lock TTL in seconds (2 minutes)
const LOCK_TTL_SECONDS = 120
// Threshold for lock renewal (renew when 80% of TTL has elapsed)
const LOCK_RENEWAL_THRESHOLD = 0.8
// Check interval for lock renewal in milliseconds (check every 10 seconds)
const LOCK_RENEWAL_CHECK_INTERVAL_MS = 10_000
// Maximum retry attempts
const MAX_RETRY_ATTEMPTS = 3
// Base delay in milliseconds for exponential backoff
const BASE_RETRY_DELAY_MS = 200

export enum GraphStatus {
  ACTIVE = 'active',
  OFFLOADED = 'offloaded',
}

export class GraphOffloader {
  /**
   * Gets the Redis key for storing graph status.
   * @param graph The graph name
   * @returns Redis key string
   */
  private getStatusKey = (graph: string) => `graph:status:${graph}`

  /**
   * Gets the Redis key for storing graph access times (sorted set).
   * @returns Redis key string
   */
  private getAccessTimeKey = () => 'graph:access_time'

  /**
   * Gets the Redis key for storing graph lock.
   * @param graph The graph name
   * @returns Redis key string
   */
  private getLockKey = (graph: string) => `graph:lock:${graph}`

  /**
   * Generates the S3 key for storing graph dump.
   * Uses sanitized graph name and hex-encoded graph name for uniqueness.
   * @param graph The graph name
   * @returns S3 key string
   */
  private getS3Key = (graph: string) => {
    const graphHex = Buffer.from(graph, 'utf8').toString('hex')
    return `graphs/${sanitize(graph)}/${graphHex}.dump`
  }

  /**
   * Gets the current time in hours since Unix epoch.
   * Used for tracking graph access times.
   * @returns Hours since epoch
   */
  private getHoursSinceEpoch = () => Math.floor(Date.now() / 1000 / 3600)

  /**
   * Waits for a calculated delay using exponential backoff with jitter.
   * @param retryAttempt Current retry attempt number (0-based)
   * @param baseDelayMs Base delay in milliseconds
   * @returns Promise that resolves after the calculated delay
   */
  private async waitWithExponentialBackoff(
    retryAttempt: number,
    baseDelayMs: number = BASE_RETRY_DELAY_MS,
  ): Promise<void> {
    // Calculate exponential backoff with jitter
    const delayMs = baseDelayMs * Math.pow(2, retryAttempt)
    const jitterMs = Math.random() * delayMs * 0.3 // Add up to 30% jitter
    const totalDelayMs = delayMs + jitterMs

    await new Promise((resolve) => setTimeout(resolve, totalDelayMs))
  }

  #client: Awaited<ReturnType<typeof getRedis>> | undefined

  /**
   * Initializes the Redis client if not already initialized.
   * Must be called before using any other methods.
   */
  async init() {
    this.#client ??= await getRedis()
  }

  /**
   * Gets the Redis client instance.
   * @throws Error if client is not initialized (call init() first)
   * @returns The Redis client instance
   */
  get client() {
    return this.#client!
  }

  /**
   * Acquires a lock for the given graph using a random value.
   * @param graph The graph name
   * @param ttl Lock TTL in seconds
   * @returns The random lock value if acquired successfully, false if failed
   */
  private async acquireLock(graph: string, ttl = LOCK_TTL_SECONDS): Promise<string | false> {
    // Generate a random value for the lock
    const lockValue = randomBytes(16).toString('hex')
    const result = await this.client.set(this.getLockKey(graph), lockValue, {
      NX: true,
      EX: ttl,
    })
    return result === 'OK' ? lockValue : false
  }

  #releaseLockScriptHash: string | undefined
  #renewLockScriptHash: string | undefined
  #checkStatusAndRefreshAccessScriptHash: string | undefined

  /**
   * Gets or computes the SHA1 hash of the release lock Lua script.
   * The script will be loaded on-demand when first used via EVAL, then cached.
   * @returns SHA1 hash of the release lock script
   */
  private get releaseLockScriptHash(): string {
    // Compute SHA1 hash of the script for EVALSHA
    this.#releaseLockScriptHash ??= createHash('sha1').update(RELEASE_LOCK_SCRIPT).digest('hex')
    return this.#releaseLockScriptHash
  }

  /**
   * Gets or computes the SHA1 hash of the renew lock Lua script.
   * The script will be loaded on-demand when first used via EVAL, then cached.
   * @returns SHA1 hash of the renew lock script
   */
  private get renewLockScriptHash(): string {
    // Compute SHA1 hash of the script for EVALSHA
    this.#renewLockScriptHash ??= createHash('sha1').update(RENEW_LOCK_SCRIPT).digest('hex')
    return this.#renewLockScriptHash
  }

  /**
   * Gets or computes the SHA1 hash of the check status and refresh access Lua script.
   * The script will be loaded on-demand when first used via EVAL, then cached.
   * @returns SHA1 hash of the check status and refresh access script
   */
  private get checkStatusAndRefreshAccessScriptHash(): string {
    // Compute SHA1 hash of the script for EVALSHA
    this.#checkStatusAndRefreshAccessScriptHash ??= createHash('sha1')
      .update(CHECK_STATUS_AND_REFRESH_ACCESS_SCRIPT)
      .digest('hex')
    return this.#checkStatusAndRefreshAccessScriptHash
  }

  /**
   * Releases a lock for the given graph using Lua script to atomically check and delete.
   * Uses EVALSHA if script is loaded, falls back to EVAL if not.
   * @param graph The graph name
   * @param lockValue The lock value returned from acquireLock
   */
  private async releaseLock(graph: string, lockValue: string): Promise<void> {
    const lockKey = this.getLockKey(graph)

    try {
      // Try to use EVALSHA
      await this.client.evalSha(this.releaseLockScriptHash, {
        keys: [lockKey],
        arguments: [lockValue],
      })
    } catch (error) {
      let finalErr = error
      // If NOSCRIPT error, script was not found on this node, fall back to EVAL
      if (error?.toString().includes('NOSCRIPT')) {
        try {
          // Script not found on this node, use EVAL instead
          // The script will be cached on the node for future use
          await this.client.eval(RELEASE_LOCK_SCRIPT, {
            keys: [lockKey],
            arguments: [lockValue],
          })
          finalErr = undefined
        } catch (error) {
          finalErr = error
        }
      }
      if (finalErr) {
        // The lock will be released automatically when TTL expires
        console.error(`Failed to release lock for graph ${graph}:`, finalErr)
      }
    }
  }

  /**
   * Renews a lock for the given graph using Lua script to atomically check and extend TTL.
   * Uses EVALSHA if script is loaded, falls back to EVAL if not.
   * @param graph The graph name
   * @param lockValue The lock value returned from acquireLock
   * @param ttl Lock TTL in seconds
   * @returns true if lock was renewed, false otherwise
   */
  private async renewLock(
    graph: string,
    lockValue: string,
    ttl = LOCK_TTL_SECONDS,
  ): Promise<boolean> {
    const lockKey = this.getLockKey(graph)

    try {
      // Try to use EVALSHA
      const result = await this.client.evalSha(this.renewLockScriptHash, {
        keys: [lockKey],
        arguments: [lockValue, ttl.toString()],
      })
      return result === 1
    } catch (error) {
      let finalErr = error
      // If NOSCRIPT error, script was not found on this node, fall back to EVAL
      if (error?.toString().includes('NOSCRIPT')) {
        try {
          // Script not found on this node, use EVAL instead
          // The script will be cached on the node for future use
          const result = await this.client.eval(RENEW_LOCK_SCRIPT, {
            keys: [lockKey],
            arguments: [lockValue, ttl.toString()],
          })
          return result === 1
        } catch (error) {
          finalErr = error
        }
      }
      if (finalErr) {
        console.error(`Failed to renew lock for graph ${graph}:`, finalErr)
        return false
      }
      return false
    }
  }

  /**
   * Executes a long-running operation while monitoring and renewing the lock if needed.
   * This function runs the operation and a lock renewal checker in parallel.
   * The renewal checker periodically checks if the lock has been held for more than
   * LOCK_RENEWAL_THRESHOLD of its TTL, and renews it if needed.
   *
   * @param graph The graph name
   * @param lockValue The lock value returned from acquireLock
   * @param operation The async operation to execute
   * @returns The result of the operation
   */
  private async withLockRenewal<T>(
    graph: string,
    lockValue: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    // Record lock start time when entering this method
    const lockStartTime = performance.now()
    let operationCompleted = false

    // Start lock renewal checker in parallel
    const renewalChecker = (async () => {
      while (!operationCompleted) {
        await new Promise((resolve) => setTimeout(resolve, LOCK_RENEWAL_CHECK_INTERVAL_MS))

        // Calculate elapsed time in milliseconds
        const elapsedMs = performance.now() - lockStartTime
        const elapsedSeconds = elapsedMs / 1000
        const thresholdSeconds = LOCK_TTL_SECONDS * LOCK_RENEWAL_THRESHOLD

        // If lock has been held for more than threshold, renew it
        // Note: operationCompleted check is handled by while loop condition
        if (elapsedSeconds >= thresholdSeconds) {
          const renewed = await this.renewLock(graph, lockValue)
          if (renewed) {
            console.log(
              `Renewed lock for graph ${graph} after ${elapsedSeconds.toFixed(2)}s (threshold: ${thresholdSeconds}s)`,
            )
          } else {
            console.warn(
              `Failed to renew lock for graph ${graph} after ${elapsedSeconds.toFixed(2)}s`,
            )
          }
        }
      }
    })()

    // Execute the operation
    try {
      const result = await operation()
      operationCompleted = true
      return result
    } catch (error) {
      operationCompleted = true
      throw error
    } finally {
      // Wait for renewal checker to finish
      await renewalChecker.catch((error) => {
        // Ignore errors from renewal checker, but log them
        if (!operationCompleted) {
          console.error(`Lock renewal checker error for graph ${graph}:`, error)
        }
      })
    }
  }

  /**
   * Sets the status of a graph in Redis.
   * @param graph The graph name
   * @param status The status to set
   */
  async setStatus(graph: string, status: GraphStatus): Promise<void> {
    await this.client.set(this.getStatusKey(graph), status)
  }

  /**
   * Gets the current status of a graph.
   * @param graph The graph name
   * @returns The graph status, or undefined if status doesn't exist
   */
  async status(graph: string): Promise<GraphStatus | undefined> {
    return ((await this.client.get(this.getStatusKey(graph))) ?? undefined) as
      | GraphStatus
      | undefined
  }

  /**
   * Checks graph status and refreshes access time if needed using Lua script.
   * Uses EVALSHA if script is loaded, falls back to EVAL if not.
   * @param graph The graph name
   * @returns The graph status, or undefined if status doesn't exist
   */
  private async checkStatusAndRefreshAccess(graph: string): Promise<GraphStatus | undefined> {
    const statusKey = this.getStatusKey(graph)
    const accessTimeKey = this.getAccessTimeKey()
    const currentHours = this.getHoursSinceEpoch().toString()

    try {
      // Try to use EVALSHA
      const result = await this.client.evalSha(this.checkStatusAndRefreshAccessScriptHash, {
        keys: [statusKey, accessTimeKey],
        arguments: [graph, currentHours],
      })
      return (result ?? undefined) as GraphStatus | undefined
    } catch (error) {
      let finalErr = error
      // If NOSCRIPT error, script was not found on this node, fall back to EVAL
      if (error?.toString().includes('NOSCRIPT')) {
        try {
          // Script not found on this node, use EVAL instead
          // The script will be cached on the node for future use
          const result = await this.client.eval(CHECK_STATUS_AND_REFRESH_ACCESS_SCRIPT, {
            keys: [statusKey, accessTimeKey],
            arguments: [graph, currentHours],
          })
          return (result ?? undefined) as GraphStatus | undefined
        } catch (error) {
          finalErr = error
        }
      }
      console.error(`Failed to check status and refresh access for graph ${graph}:`, finalErr)
      throw finalErr
    }
  }

  /**
   * Ensures the graph is active and loaded in Redis.
   * This method should be called before any operation on a graph.
   * It handles restoring the graph from offload storage if necessary.
   * @param graph The name of the graph to access.
   * @param retryAttempt Current retry attempt number (internal use)
   */
  async access(graph: string, retryAttempt = 0): Promise<void> {
    // Fast path: if graph is active, refresh access time atomically and return.
    const status = await this.checkStatusAndRefreshAccess(graph)
    if (status === GraphStatus.ACTIVE) {
      return
    }

    // Slow path: graph might be offloaded, need to check and potentially restore
    const lockValue = await this.acquireLock(graph)
    if (!lockValue) {
      // Could not acquire lock, another process is handling this graph. Wait and retry with exponential backoff.
      if (retryAttempt >= MAX_RETRY_ATTEMPTS) {
        throw new Error(
          `Failed to acquire lock for graph ${graph} after ${MAX_RETRY_ATTEMPTS} attempts`,
        )
      }

      await this.waitWithExponentialBackoff(retryAttempt)
      return this.access(graph, retryAttempt + 1)
    }

    try {
      // Wrap all operations in withLockRenewal to ensure lock doesn't expire during long-running operations
      await this.withLockRenewal(graph, lockValue, async () => {
        // Re-check status after acquiring lock (status may have changed)
        const status = await this.checkStatusAndRefreshAccess(graph)
        if (status === GraphStatus.OFFLOADED) {
          // Graph is offloaded, restore it from S3
          await this.restore(graph)
        } else if (!status) {
          // Graph doesn't exist yet, initialize access time and status.
          // Defensively delete the key before initialization to handle zombie data.
          await this.client.del(graph)
          await this.client.zAdd(this.getAccessTimeKey(), {
            score: this.getHoursSinceEpoch(),
            value: graph,
          })
          await this.setStatus(graph, GraphStatus.ACTIVE)
        }
      })
    } finally {
      await this.releaseLock(graph, lockValue)
    }
  }

  /**
   * Restores a graph from S3 backup to Redis.
   * This method assumes a lock is already held on the graph.
   * Implements exponential backoff with jitter for retry logic.
   * @param graph The graph name to restore
   * @param retryAttempt Current retry attempt number (internal use)
   * @throws Error if restoration fails after all retry attempts
   */
  private async restore(graph: string, retryAttempt = 0): Promise<void> {
    // This method assumes a lock is already held on the graph.
    const s3Key = this.getS3Key(graph)

    try {
      const data = await downloadFromS3(s3Key)

      // Defensively delete the key before restoring to handle zombie data
      // from a previously failed restore or dump operation.
      await this.client.del(graph)

      await this.client.zAdd(this.getAccessTimeKey(), {
        score: this.getHoursSinceEpoch(),
        value: graph,
      })
      await this.client.restore(graph, 0, data)
      await this.setStatus(graph, GraphStatus.ACTIVE)

      console.log(`Successfully restored graph ${graph} from S3.`)
    } catch (error) {
      if (retryAttempt >= MAX_RETRY_ATTEMPTS) {
        // Last attempt failed, throw the error
        console.error(
          `Failed to restore graph ${graph} after ${MAX_RETRY_ATTEMPTS} attempts:`,
          error,
        )
        throw error
      }

      console.warn(
        `Restore attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS} failed for graph ${graph}, retrying:`,
        error,
      )
      await this.waitWithExponentialBackoff(retryAttempt)
      return this.restore(graph, retryAttempt + 1)
    }
  }

  /**
   * Dumps a graph from Redis to S3 and marks it as offloaded.
   * If the graph doesn't exist or is already offloaded, cleans up Redis records.
   * @param graph The graph name to dump
   */
  async dump(graph: string): Promise<void> {
    const lockValue = await this.acquireLock(graph)
    if (!lockValue) {
      console.log(
        `Could not acquire lock to dump graph ${graph}. Another process may be working on it.`,
      )
      return
    }

    try {
      // Wrap all operations in withLockRenewal to ensure lock doesn't expire during long-running operations
      await this.withLockRenewal(graph, lockValue, async () => {
        const status = await this.status(graph)
        if (!status || status === GraphStatus.OFFLOADED) {
          if (!status) {
            console.log(`Graph ${graph} does not exist. Skipping dump.`)
          } else {
            console.log(`Graph ${graph} is already offloaded. Skipping dump.`)
          }
          // Clean up Redis records for non-existent or already offloaded graphs
          await this.client.del(graph)
          await this.client.zRem(this.getAccessTimeKey(), graph)
          return
        }

        // Re-verify the access time AFTER acquiring the lock.
        const accessTimeScore = await this.client.zScore(this.getAccessTimeKey(), graph)
        if (accessTimeScore) {
          const nowInHours = this.getHoursSinceEpoch()
          const idleThreshold = nowInHours - MAX_IDLE_HOURS
          if (accessTimeScore >= idleThreshold) {
            // The graph was accessed recently, so it's no longer considered idle.
            // Abort the dump operation for this graph.
            console.log(`Graph ${graph} was accessed recently. Aborting offload.`)
            return
          }
        }

        // Dump graph data with proper type mapping for binary data
        const data = await this.client
          .withTypeMapping({
            [RESP_TYPES.BLOB_STRING]: Buffer,
          })
          .dump(graph)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!data) {
          // `data` may be null if graph doesn't exist
          console.warn(`Graph ${graph} does not exist, cannot dump.`)
          await this.client.del(this.getStatusKey(graph))
        } else {
          // Upload to S3 and mark as offloaded
          await uploadToS3(this.getS3Key(graph), data)
          await this.client.set(this.getStatusKey(graph), GraphStatus.OFFLOADED)
        }

        // Remove graph data and access time record from Redis after offloading
        await this.client.del(graph)
        await this.client.zRem(this.getAccessTimeKey(), graph)
      })
    } finally {
      await this.releaseLock(graph, lockValue)
    }
  }

  /**
   * Deletes a graph and all its associated data.
   * This includes the graph data in Redis & S3 backup, status, and access time records.
   * @param graph The name of the graph to delete
   * @param retryAttempt Current retry attempt number (internal use)
   */
  async delete(graph: string, retryAttempt = 0): Promise<void> {
    const lockValue = await this.acquireLock(graph)
    if (!lockValue) {
      console.log(
        `Could not acquire lock to delete graph ${graph}. Another process may be working on it.`,
      )
      // Could not acquire lock. Wait and retry with exponential backoff.
      if (retryAttempt >= MAX_RETRY_ATTEMPTS) {
        throw new Error(
          `Failed to acquire lock for graph ${graph} after ${MAX_RETRY_ATTEMPTS} attempts`,
        )
      }

      await this.waitWithExponentialBackoff(retryAttempt)
      return this.delete(graph, retryAttempt + 1)
    }

    try {
      // Wrap all operations in withLockRenewal to ensure lock doesn't expire during long-running operations
      await this.withLockRenewal(graph, lockValue, async () => {
        // Delete graph data, status, and access time records from Redis
        await this.client.del(this.getStatusKey(graph))
        await this.client.del(graph)
        await this.client.zRem(this.getAccessTimeKey(), graph)

        console.log(`Successfully deleted graph ${graph}`)

        // Delete S3 backup (non-critical, continue even if it fails)
        try {
          const s3Key = this.getS3Key(graph)
          await deleteFromS3(s3Key)
          console.log(`Deleted S3 backup for graph ${graph}`)
        } catch (error) {
          console.warn(`Failed to delete S3 backup for graph ${graph}:`, error)
          // Continue with deletion even if S3 deletion fails (S3 cleanup is non-critical)
        }
      })
    } catch (error) {
      console.error(`Failed to delete graph ${graph}:`, error)
      throw error
    } finally {
      await this.releaseLock(graph, lockValue)
    }
  }

  /**
   * Finds and offloads idle graphs that haven't been accessed for MAX_IDLE_HOURS.
   * Processes up to MAX_PARALLEL_DUMPS graphs in parallel.
   * @returns true if there are more idle graphs to offload (hit the limit), false otherwise
   */
  async findAndOffloadIdleGraphs(): Promise<boolean> {
    const nowInHours = this.getHoursSinceEpoch()
    const idleThreshold = nowInHours - MAX_IDLE_HOURS

    // Find graphs with access time older than the threshold
    const idleGraphs = await this.client.zRangeByScore(this.getAccessTimeKey(), 0, idleThreshold, {
      LIMIT: {
        offset: 0,
        count: MAX_PARALLEL_DUMPS,
      },
    })

    console.log(`Found idle graphs: ${idleGraphs.join(', ')}. Attempting to offload.`)

    // Offload graphs in parallel
    await Promise.all(
      idleGraphs.map(async (graph: string) => {
        try {
          await this.dump(graph)
          console.log(`Successfully offloaded graph ${graph} to S3.`)
        } catch (error) {
          console.error(`Error offloading idle graph ${graph}:`, error)
          await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 100))
        }
      }),
    )

    // Return true if there are more idle graphs to offload, false otherwise
    return idleGraphs.length >= MAX_PARALLEL_DUMPS
  }
}
