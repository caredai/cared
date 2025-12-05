/// <reference types="@cloudflare/workers-types" />

import type { DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite'
import { DurableObject } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/durable-sqlite'
import { migrate } from 'drizzle-orm/durable-sqlite/migrator'

import migrations from './migrations/migrations'

export class DODatabase extends DurableObject {
  storage: DurableObjectStorage
  db: DrizzleSqliteDODatabase

  constructor(ctx: DurableObjectState, env: object) {
    super(ctx, env)
    this.storage = ctx.storage
    this.db = drizzle(this.storage, { logger: false })

    // Make sure all migrations complete before accepting queries.
    void ctx.blockConcurrencyWhile(async () => {
      await this.migrate()
    })
  }

  async migrate() {
    await migrate(this.db, migrations)
  }
}
