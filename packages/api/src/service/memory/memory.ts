import type { MemoryAction, MemoryInput, MemoryMode, MemoryPrimaryEntity } from '@cared/db/schema'
import { and, asc, eq, gt } from '@cared/db'
import { db } from '@cared/db/client'
import { MemoryHistory, MemorySpace, MemoryStore } from '@cared/db/schema'

import type { Entity, FilterInput, Metadata } from './types'
import { VectorService, VectorType } from '../vector'
import { stripIdPrefix } from '../../utils'
import { ORPCError } from '@orpc/server'

export type Mode = 'managed' | 'uncontrolled'

export class MemoryService {
  /**
   * Create a new memory store.
   * @param name - Store name
   * @param mode - Memory mode
   * @param accountId - Account ID (required)
   * @param userId - User ID (required only for 'managed' mode)
   * @returns The created memory store
   */
  async createStore({
    name,
    mode,
    accountId,
    userId,
  }: {
    name: string
    mode: MemoryMode
    accountId: string
    userId?: string
  }): Promise<MemoryStore> {
    if (mode === 'managed' && !userId) {
      throw new Error('userId is required for managed mode')
    }

    const [store] = await db
      .insert(MemoryStore)
      .values({
        name,
        mode,
        accountId,
        userId: mode === 'managed' ? userId : undefined,
      })
      .returning()

    if (!store) {
      throw new Error('Failed to create memory store')
    }

    return store
  }

  /**
   * Update a memory store (only name can be updated).
   * @param id - Store ID
   * @param name - New store name
   * @returns The updated memory store
   */
  async updateStore({ id, name }: { id: string; name: string }): Promise<MemoryStore> {
    const [store] = await db
      .update(MemoryStore)
      .set({ name })
      .where(eq(MemoryStore.id, id))
      .returning()

    if (!store) {
      throw new Error('Memory store not found')
    }

    return store
  }

  /**
   * Delete a memory store by ID.
   * @param id - Store ID
   */
  async deleteStore(id: string): Promise<void> {
    // TODO: delete resources
    await db.delete(MemoryStore).where(eq(MemoryStore.id, id))
  }

  /**
   * Get a memory store by ID.
   * @param id - Store ID
   * @returns The memory store
   * @throws Error if store not found
   */
  async getStore(id: string): Promise<MemoryStore> {
    const [store] = await db.select().from(MemoryStore).where(eq(MemoryStore.id, id)).limit(1)

    if (!store) {
      throw new Error('Memory store not found')
    }

    return store
  }

  /**
   * Get memory stores by mode and corresponding ID with pagination.
   * @param mode - Memory mode
   * @param accountId - Account ID (required)
   * @param userId - User ID (required only for 'managed' mode)
   * @param limit
   * @param cursor
   * @returns Paginated list of memory stores
   */
  async getStores({
    mode,
    accountId,
    userId,
    limit = 20,
    cursor,
  }: {
    mode: MemoryMode
    accountId: string
    userId?: string
    limit?: number
    cursor?: string
  }): Promise<{ stores: MemoryStore[]; hasMore: boolean; cursor?: string }> {
    if (mode === 'managed' && !userId) {
      throw new Error('userId is required for managed mode')
    }

    const conditions = [
      eq(MemoryStore.mode, mode),
      eq(MemoryStore.accountId, accountId),
      mode === 'managed' && userId ? eq(MemoryStore.userId, userId) : undefined,
      cursor ? gt(MemoryStore.id, cursor) : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> => condition !== undefined)

    const stores = await db.query.MemoryStore.findMany({
      where: and(...conditions),
      orderBy: asc(MemoryStore.id),
      limit: limit + 1,
    })
    const hasMore = stores.length > limit
    if (hasMore) {
      stores.pop()
    }
    return {
      stores,
      hasMore,
      cursor: stores.at(-1)?.id,
    }
  }

  /**
   * Create a new memory space.
   * @param storeId - Store ID
   * @param primary - Primary entity type
   * @param entityId - Primary entity ID
   * @returns The created memory space
   */
  async createSpace({
    storeId,
    primary,
    entityId,
  }: {
    storeId: string
    primary: MemoryPrimaryEntity
    entityId: string
  }): Promise<MemorySpace> {
    const store = await this.getStore(storeId)

    const [space] = await db
      .insert(MemorySpace)
      .values({
        storeId,
        primary,
        entityId,
      })
      .returning()

    if (!space) {
      throw new Error('Failed to create memory space')
    }

    return space
  }

  /**
   * Delete a memory space by ID.
   * @param id - Space ID
   */
  async deleteSpace(id: string): Promise<void> {
    await db.delete(MemorySpace).where(eq(MemorySpace.id, id))
  }

  /**
   * Get memory spaces with pagination.
   * @param storeId - Store ID (required)
   * @param primary - Filter by primary entity type (optional)
   * @param limit - Maximum number of results
   * @param cursor - Cursor for pagination
   * @returns Paginated list of memory spaces
   */
  async getSpaces({
    storeId,
    primary,
    limit = 20,
    cursor,
  }: {
    storeId: string
    primary?: MemoryPrimaryEntity
    limit?: number
    cursor?: string
  }): Promise<{ spaces: MemorySpace[]; hasMore: boolean; cursor?: string }> {
    const conditions = [
      eq(MemorySpace.storeId, storeId),
      primary ? eq(MemorySpace.primary, primary) : undefined,
      cursor ? gt(MemorySpace.id, cursor) : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> => condition !== undefined)

    const spaces = await db.query.MemorySpace.findMany({
      where: and(...conditions),
      orderBy: asc(MemorySpace.id),
      limit: limit + 1,
    })

    const hasMore = spaces.length > limit
    if (hasMore) {
      spaces.pop()
    }

    return {
      spaces,
      hasMore,
      cursor: spaces.at(-1)?.id,
    }
  }

  private getVectorService(store: MemoryStore) {
    return new VectorService(
      store.accountId,
      store.mode === 'uncontrolled'
        ? VectorType.INTERNAL_UNCONTROLLED
        : VectorType.INTERNAL_MANAGED,
    )
  }

  private vectorNamespaceForSpace(spaceId: string) {
    const namespace = stripIdPrefix(spaceId)
    if (namespace.length !== 32) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Invalid memory space ID',
      })
    }
    return namespace
  }

  async addMemory({
    messages,
    metadata,
    infer,
    ...attributes
  }: Entity & {
    messages: {
      role: 'system' | 'assistant' | 'user'
      content: string
    }[]
    metadata: Metadata
    infer?: boolean
  }) {
    // TODO
  }

  async updateMemory({
    id,
    memory,
    metadata,
  }: {
    id: string
    memory?: string
    metadata?: Partial<Metadata>
  }) {}

  async updateMemories(
    updates: {
      id: string
      memory?: string
      metadata?: Partial<Metadata>
    }[],
  ) {}

  async deleteMemory(id: string) {}

  async deleteMemories(ids: string[]) {}

  async deleteMemoriesByFilter(filter: FilterInput) {}

  async getMemories() {}

  async searchMemories() {}

  async getMemoryHistory(id: string): Promise<MemoryHistory[]> {
    return await db.select().from(MemoryHistory).where(eq(MemoryHistory.memoryId, id))
  }

  private async addHistory(item: {
    memoryId: string
    oldMemory?: string
    newMemory?: string
    action: MemoryAction
    input?: MemoryInput
  }) {
    await db.insert(MemoryHistory).values(item)
  }
}
