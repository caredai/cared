import type { CaredOrpcClient } from '../cared.js'
import type { ParsedGatewayHost } from '../server/host.js'
import type { ConnectionUri } from './drizzle-api.js'
import { branchLock, waitWithExponentialBackoff } from '../lock/lock.js'
import { touchBranchAccess } from './access.js'
import {
  findConnectionDivergenceIndex,
  initGateway,
  listSlotConnections,
  replaceAllSlots,
  syncSlotsFromDivergence,
} from './drizzle-api.js'
import {
  createGatewayPod,
  deleteGatewayPod,
  gatewayReadyAndUrl,
  getPodName,
  markPodGatewayReady,
  podExists,
  waitForPodReady,
} from './k8s.js'
import {
  isAccessFreshForGatewayCache,
  readGatewayUrlFromCache,
  setCachedGatewayUrl,
} from './url.js'

export class GatewayManager {
  async fetchConnectionUris(
    client: CaredOrpcClient,
    host: ParsedGatewayHost,
  ): Promise<ConnectionUri[]> {
    const result = await client.account.database.listConnectionUris({
      namespaceId: host.namespaceId,
      branchId: host.branchId,
    })

    return result.connectionUris
  }

  /**
   * Resolves a ready gateway URL from Redis or Kubernetes when access is fresh.
   * Returns undefined when access is near idle so ensureGateway recreates the pod.
   */
  private async resolveReadyGatewayUrl(
    branchKey: string,
    podName: string,
  ): Promise<string | undefined> {
    if (!(await isAccessFreshForGatewayCache(branchKey))) {
      return undefined
    }

    const cached = await readGatewayUrlFromCache(branchKey)
    if (cached) {
      return cached
    }

    const baseUrl = await gatewayReadyAndUrl(podName)
    if (baseUrl) {
      await setCachedGatewayUrl(branchKey, baseUrl)
    }
    return baseUrl
  }

  async ensureGateway(
    client: CaredOrpcClient,
    host: ParsedGatewayHost,
    retryAttempt = 0,
  ): Promise<string> {
    const podName = getPodName(host.branchKey)

    const baseUrl = await this.resolveReadyGatewayUrl(host.branchKey, podName)
    if (baseUrl) {
      return baseUrl
    }

    const lockValue = await branchLock.acquire(host.branchKey)
    if (!lockValue) {
      if (retryAttempt >= 8) {
        throw new Error(`Failed to acquire lock for gateway ${host.branchKey}`)
      }
      await waitWithExponentialBackoff(retryAttempt, 500)
      return this.ensureGateway(client, host, retryAttempt + 1)
    }

    try {
      return await branchLock.withRenewal(host.branchKey, lockValue, async () => {
        let baseUrl = await this.resolveReadyGatewayUrl(host.branchKey, podName)
        if (baseUrl) {
          return baseUrl
        }

        if (await podExists(podName)) {
          await deleteGatewayPod(podName, host.branchKey)
        }

        const connections = await this.fetchConnectionUris(client, host)
        await touchBranchAccess(host.branchKey)
        await createGatewayPod(podName, host.branchKey)
        baseUrl = await waitForPodReady(podName)
        await initGateway(baseUrl)
        await replaceAllSlots(baseUrl, connections)
        await markPodGatewayReady(podName)
        await setCachedGatewayUrl(host.branchKey, baseUrl)
        return baseUrl
      })
    } finally {
      await branchLock.release(host.branchKey, lockValue)
    }
  }

  /**
   * Syncs Drizzle Gateway slots with the latest connections from Cared.
   * Prefix-matching slots are left unchanged; from the first mismatch onward,
   * trailing slots are removed and replaced with the expected tail.
   */
  async syncGateway(client: CaredOrpcClient, host: ParsedGatewayHost) {
    const baseUrl = await this.ensureGateway(client, host)
    const [expected, actual] = await Promise.all([
      this.fetchConnectionUris(client, host),
      listSlotConnections(baseUrl),
    ])

    const divergenceIndex = findConnectionDivergenceIndex(expected, actual)
    if (divergenceIndex === null) {
      return { synced: false }
    }

    await syncSlotsFromDivergence(baseUrl, expected, divergenceIndex)
    return { synced: true }
  }
}

export const gatewayManager = new GatewayManager()
