import { StorageClient } from '@supabase/storage-js'

import type { SbBucket } from '@cared/db/schema'
import { and, asc, eq, gt } from '@cared/db'
import { db } from '@cared/db/client'
import { SbBucket as SbBucketTable } from '@cared/db/schema'

import { env } from '../../env'

// https://developers.cloudflare.com/r2/reference/data-location/#available-hints
export enum StorageLocation {
  WNAM = 'wnam', // Western North America
  ENAM = 'enam', // Eastern North America
  WEUR = 'weur', // Western Europe
  EEUR = 'eeur', // Eastern Europe
  APAC = 'apac', // Asia-Pacific
  OC = 'oc', // Oceania
}

export class StorageAdminManager {
  static #apiUrls: Map<StorageLocation, string> | undefined
  static get apiUrls() {
    StorageAdminManager.#apiUrls ??= new Map(
      env.SUPABASE_STORAGE_API_URLS! as [[StorageLocation, string]],
    )
    return StorageAdminManager.#apiUrls
  }

  static #instances = new Map<StorageLocation, StorageAdminManager>()
  static instance(location: StorageLocation) {
    let instance = StorageAdminManager.#instances.get(location)
    if (!instance) {
      const apiUrl = StorageAdminManager.apiUrls.get(location)!
      instance = new StorageAdminManager(apiUrl)
      StorageAdminManager.#instances.set(location, instance)
    }
    return instance
  }

  constructor(private apiUrl: string) {}

  async getTenant(accountId: string) {
    const res = await fetch(`${this.apiUrl}/tenants/${accountId}`, {
      headers: {
        Authorization: `Bearer ${env.SUPABASE_STORAGE_ADMIN_API_KEY!}`,
      },
    })
    if (!res.ok) {
      throw new Error('Unable to get tenant')
    }
    return await res.json()
  }
}

export class StorageManager {
  async getClient(accountId: string, location: StorageLocation) {
    const storageAdminService = StorageAdminManager.instance(location)
    const { serviceKey } = (await storageAdminService.getTenant(accountId)) as any
    const apiUrl = StorageAdminManager.apiUrls.get(location)!
    return new StorageClient(apiUrl, {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    })
  }
}

export class StorageService {
  async getBuckets(
    accountId: string,
    { limit = 20, cursor }: { limit?: number; cursor?: string } = {},
  ): Promise<{ buckets: SbBucket[]; hasMore: boolean; cursor?: string }> {
    const conditions = [
      eq(SbBucketTable.accountId, accountId),
      cursor ? gt(SbBucketTable.id, cursor) : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> => condition !== undefined)

    const buckets = await db.query.SbBucket.findMany({
      where: and(...conditions),
      orderBy: asc(SbBucketTable.id),
      limit: limit + 1,
    })

    const hasMore = buckets.length > limit
    if (hasMore) {
      buckets.pop()
    }

    return {
      buckets,
      hasMore,
      cursor: buckets.at(-1)?.id,
    }
  }
}

export const storageService = new StorageService()
