import { TRPCError } from '@trpc/server'

import type { OrganizationStatementsSubset } from '@cared/auth'
import type { Database, Transaction } from '@cared/db/client'
import { auth, headers } from '@cared/auth'
import { eq } from '@cared/db'
import { App, Workspace } from '@cared/db/schema'

export class OrganizationScope {
  constructor(public organizationId: string) {}

  static async fromWorkspace(db: Database | Transaction, workspaceId: string) {
    const workspace = await db.query.Workspace.findFirst({
      where: eq(Workspace.id, workspaceId),
    })
    if (!workspace) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Workspace not found',
      })
    }

    return new OrganizationScope(workspace.organizationId)
  }

  static async fromApp(db: Database | Transaction, app: string | App) {
    if (typeof app !== 'string') {
      return await OrganizationScope.fromWorkspace(db, app.workspaceId)
    } else {
      const [result] = await db
        .select({
          organizationId: Workspace.organizationId,
        })
        .from(App)
        .innerJoin(Workspace, eq(App.workspaceId, Workspace.id))
        .where(eq(App.id, app))
        .limit(1)

      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'App not found',
        })
      }

      return new OrganizationScope(result.organizationId)
    }
  }

  async checkPermissions(permissions: OrganizationStatementsSubset = {}) {
    const { success } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        organizationId: this.organizationId,
        permissions,
      },
    })
    if (!success) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action',
      })
    }
  }
}
