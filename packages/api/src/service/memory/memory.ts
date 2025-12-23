import type { MemoryAction, MemoryInput, MemoryMode, MemoryPrimaryEntity } from '@cared/db/schema'
import { and, asc, eq, gt } from '@cared/db'
import { db } from '@cared/db/client'
import { MemoryHistory, MemorySpace, MemoryStore } from '@cared/db/schema'

import type { Entity, FilterInput, Metadata } from './types'

export type Mode = 'managed' | 'uncontrolled'

export class MemoryService {
  /**
   * Create a new memory store.
   * @param name - Store name
   * @param mode - Memory mode ('uncontrolled' requires accountId, 'managed' requires userId)
   * @param accountId - Account ID (required for 'uncontrolled' mode)
   * @param userId - User ID (required for 'managed' mode)
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
    accountId?: string
    userId?: string
  }): Promise<MemoryStore> {
    if (mode === 'uncontrolled' && !accountId) {
      throw new Error('accountId is required for uncontrolled mode')
    }
    if (mode === 'managed' && !userId) {
      throw new Error('userId is required for managed mode')
    }

    const [store] = await db
      .insert(MemoryStore)
      .values({
        name,
        mode,
        accountId: mode === 'uncontrolled' ? accountId : undefined,
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
   * Get memory stores by mode and corresponding ID with pagination.
   * @param mode - Memory mode
   * @param accountId - Account ID (required for 'uncontrolled' mode)
   * @param userId - User ID (required for 'managed' mode)
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
    accountId?: string
    userId?: string
    limit?: number
    cursor?: string
  }): Promise<{ stores: MemoryStore[]; hasMore: boolean; cursor?: string }> {
    if (mode === 'uncontrolled' && !accountId) {
      throw new Error('accountId is required for uncontrolled mode')
    }
    if (mode === 'managed' && !userId) {
      throw new Error('userId is required for managed mode')
    }

    const stores = await db.query.MemoryStore.findMany({
      where: and(
        eq(MemoryStore.mode, 'uncontrolled'),
        mode === 'uncontrolled'
          ? eq(MemoryStore.accountId, accountId!)
          : eq(MemoryStore.userId, userId!),
        cursor ? gt(MemoryStore.id, cursor) : undefined,
      ),
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
