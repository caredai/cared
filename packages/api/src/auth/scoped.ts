import { TRPCError } from '@trpc/server'

import type { OrganizationStatementsSubset } from '@cared/auth'
import type { Database, Transaction } from '@cared/db/client'
import { auth, headers } from '@cared/auth'
import { eq } from '@cared/db'
import { App, Workspace } from '@cared/db/schema'

import type { Auth } from './auth'

interface Context {
  auth?: Auth
  db: Database | Transaction
}

export class OrganizationScope {
  private constructor(public organizationId: string) {}

  static fromOrganization(ctx: Context, organizationId: string) {
    if (ctx.auth && !ctx.auth.checkOrganization({ organizationId })) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this organization',
      })
    }
    return new OrganizationScope(organizationId)
  }

  static async fromWorkspace(ctx: Context, workspaceId: string) {
    const workspace = await ctx.db.query.Workspace.findFirst({
      where: eq(Workspace.id, workspaceId),
    })
    if (!workspace) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Workspace not found',
      })
    }

    if (
      ctx.auth &&
      !ctx.auth.checkWorkspace({ workspaceId, organizationId: workspace.organizationId })
    ) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this workspace',
      })
    }

    return new OrganizationScope(workspace.organizationId)
  }

  static async fromApp(ctx: Context, app: string | App) {
    let appId, workspaceId, organizationId
    if (typeof app !== 'string') {
      const workspace = await ctx.db.query.Workspace.findFirst({
        where: eq(Workspace.id, app.workspaceId),
      })
      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        })
      }

      appId = app.id
      workspaceId = app.workspaceId
      organizationId = workspace.organizationId
    } else {
      const [result] = await ctx.db
        .select({
          workspaceId: Workspace.id,
          organizationId: Workspace.organizationId,
        })
        .from(App)
        .innerJoin(Workspace, eq(Workspace.id, App.workspaceId))
        .where(eq(App.id, app))
        .limit(1)
      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'App not found',
        })
      }

      appId = app
      workspaceId = result.workspaceId
      organizationId = result.organizationId
    }

    if (ctx.auth && !ctx.auth.checkApp({ appId, workspaceId, organizationId })) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this app',
      })
    }

    return new OrganizationScope(organizationId)
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
