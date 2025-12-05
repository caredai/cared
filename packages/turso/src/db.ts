import type { Db } from './client'
import { createDb, getDb } from './client'
import { migrateDb } from './migrate'

export class TursoDb {
  constructor(private db: Db) {}

  /**
   * Create a new database in Turso
   */
  static async create({ name, group }: { name: string; group: string }) {
    return await createDb({ name, group })
  }

  /**
   * Get an instance from existing database URL
   */
  static from({ url, group }: { url: string; group: string }) {
    const db = getDb({ url, group })
    return new TursoDb(db)
  }

  /**
   * Run database migrations
   */
  async migrate() {
    await Promise.resolve(
      migrateDb({
        db: this.db,
      }),
    )
  }
}
