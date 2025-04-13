import type { HistoryManagerFactory } from 'mem0ai/oss'

import { desc, eq } from '@ownxai/db'
import { db } from '@ownxai/db/client'
import { Mem0History } from '@ownxai/db/schema'

type HistoryManager = ReturnType<(typeof HistoryManagerFactory)['create']>

export class OwnxHistoryManager implements HistoryManager {
  async addHistory(
    memoryId: string,
    previousValue: string | null,
    newValue: string | null,
    action: string,
    createdAt?: string,
    updatedAt?: string,
    isDeleted?: number,
  ): Promise<void> {
    await db.insert(Mem0History).values({
      memoryId,
      previousValue,
      newValue,
      action,
      createdAt: createdAt ? new Date(createdAt) : undefined,
      updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      isDeleted: isDeleted,
    })
  }

  async getHistory(memoryId: string): Promise<any[]> {
    return await db
      .select()
      .from(Mem0History)
      .where(eq(Mem0History.memoryId, memoryId))
      .orderBy(desc(Mem0History.id))
  }

  async reset(): Promise<void> {
    await db.delete(Mem0History)
  }

  close() {
    return
  }
}
