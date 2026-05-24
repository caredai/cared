import { ORPCError } from '@orpc/server'

import type { IntegrationType } from '@cared/db/schema'
import { and, desc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Integration } from '@cared/db/schema'

/**
 * Service for account-scoped integration (GitHub, Cloudflare, Neon, Supabase) CRUD.
 */
export class IntegrationService {
  /**
   * List integrations for an account, optionally filtered by type.
   */
  async list(
    accountId: string,
    options?: { type?: IntegrationType },
  ): Promise<{ integrations: Integration[] }> {
    const conditions = [eq(Integration.accountId, accountId)]
    if (options?.type) {
      conditions.push(eq(Integration.type, options.type))
    }

    const integrations = await db
      .select()
      .from(Integration)
      .where(and(...conditions))
      .orderBy(desc(Integration.id))

    return { integrations }
  }

  /**
   * Get a single integration by id, scoped to the given account.
   */
  async get(accountId: string, id: string): Promise<Integration> {
    const [integration] = await db
      .select()
      .from(Integration)
      .where(and(eq(Integration.id, id), eq(Integration.accountId, accountId)))
      .limit(1)

    if (!integration) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Integration not found',
      })
    }

    return integration
  }

  /**
   * Delete an integration by id, scoped to the given account.
   */
  async delete(accountId: string, id: string): Promise<void> {
    const [deleted] = await db
      .delete(Integration)
      .where(and(eq(Integration.id, id), eq(Integration.accountId, accountId)))
      .returning()

    if (!deleted) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Integration not found',
      })
    }
  }
}

export const integrationService = new IntegrationService()
