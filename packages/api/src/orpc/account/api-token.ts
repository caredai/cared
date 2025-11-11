import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { ApiTokenScope } from '@cared/db/schema'
import type { TokenPolicy } from '@cared/shared'
import { checkPermissionsByRole, PERMISSION_GROUPS, PERMISSION_GROUPS_MAP } from '@cared/auth'
import { and, asc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { ApiToken, apiTokenScope, generateId } from '@cared/db/schema'
import { tokenPolicySchema } from '@cared/shared'

import { formatApiToken, generateApiToken, getApiTokenHash, getUserAccounts } from '../../operation'
import { userPlainProtectedProcedure } from '../../orpc'

export const apiTokenRouter = {
  listPermissionGroups: userPlainProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/api-tokens/permission-groups',
      tags: ['tokens'],
      summary: 'List all permission groups',
    })
    .handler(() => {
      return {
        permissionGroups: PERMISSION_GROUPS,
      }
    }),

  list: userPlainProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/api-tokens',
      tags: ['tokens'],
      summary: 'List all API tokens for an account',
    })
    .input(
      z.object({
        scope: z.enum(apiTokenScope),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions(
        input.scope === 'account' ? { apiToken: ['read'] } : { userApiToken: ['read'] },
      )

      const tokens = await db
        .select()
        .from(ApiToken)
        .where(
          and(
            eq(ApiToken.scope, input.scope),
            input.scope === 'account'
              ? eq(ApiToken.accountId, context.auth.accountId)
              : eq(ApiToken.userId, context.auth.userId),
          ),
        )
        .orderBy(asc(ApiToken.id))

      return {
        tokens: tokens.map(formatApiToken),
      }
    }),

  get: userPlainProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/api-tokens/{id}',
      tags: ['tokens'],
      summary: 'Get an API token',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const token = await db.query.ApiToken.findFirst({
        where: eq(ApiToken.id, input.id),
      })

      if (!token) {
        throw new ORPCError('NOT_FOUND', { message: 'API token not found' })
      }

      await context.auth.requirePermissions(
        token.scope === 'account' ? { apiToken: ['read'] } : { userApiToken: ['read'] },
        { accountId: token.accountId, userId: token.userId },
      )

      return {
        token: formatApiToken(token),
      }
    }),

  create: userPlainProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/api-tokens',
      tags: ['tokens'],
      summary: 'Create a new API token',
    })
    .input(
      z
        .object({
          scope: z.enum(apiTokenScope),
          name: z.string().min(1).max(64),
          policies: z
            .array(
              tokenPolicySchema.omit({
                id: true,
              }),
            )
            .min(1),
          enabled: z.boolean().optional(),
          expiresAt: z
            .date()
            .optional()
            .refine((expiresAt) => !expiresAt || expiresAt.getTime() > Date.now(), {
              message: 'expiresAt must be a future date',
            }),
          notBefore: z
            .date()
            .optional()
            .refine((notBefore) => !notBefore || notBefore.getTime() > Date.now(), {
              message: 'notBefore must be a future date',
            }),
        })
        .refine(
          ({ expiresAt, notBefore }) =>
            !expiresAt || !notBefore || expiresAt.getTime() > notBefore.getTime(),
          {
            message: 'expiresAt must be after notBefore',
            path: ['expiresAt'],
          },
        ),
    )
    .handler(async ({ context, input }) => {
      const policies: TokenPolicy[] = input.policies.map((policy) => ({
        id: generateId('', ''),
        ...policy,
      }))

      const { scope, userId, accountId } = await validateTokenPolicies(input.scope, policies)

      await context.auth.requirePermissions(
        scope === 'account'
          ? { apiToken: ['write'] }
          : {
              userApiToken: ['write'],
            },
        {
          accountId,
          userId,
        },
      )

      const { token, hash, start, end } = await generateApiToken()

      const [newToken] = await db
        .insert(ApiToken)
        .values({
          name: input.name,
          hash,
          policies,
          enabled: input.enabled ?? true,
          expiresAt: input.expiresAt,
          notBefore: input.notBefore,
          metadata: {
            start,
            end,
          },
          scope,
          accountId: scope === 'account' ? accountId : undefined,
          userId,
        })
        .returning()

      return {
        token: {
          ...formatApiToken(newToken!),
          token: token, // The raw token is only returned on creation.
        },
      }
    }),

  rotate: userPlainProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/api-tokens/{id}/rotate',
      tags: ['tokens'],
      summary: 'Rotate an API token',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const existingToken = await db.query.ApiToken.findFirst({
        where: eq(ApiToken.id, input.id),
      })

      if (!existingToken) {
        throw new ORPCError('NOT_FOUND', { message: 'API token not found' })
      }

      await context.auth.requirePermissions(
        existingToken.scope === 'account' ? { apiToken: ['write'] } : { userApiToken: ['write'] },
        { accountId: existingToken.accountId, userId: existingToken.userId },
      )

      const { token, hash, start, end } = await generateApiToken()

      const [updatedToken] = await db
        .update(ApiToken)
        .set({
          hash,
          metadata: {
            start,
            end,
          },
        })
        .where(eq(ApiToken.id, input.id))
        .returning()

      return {
        token: {
          ...formatApiToken(updatedToken!),
          token: token,
        },
      }
    }),

  verify: userPlainProtectedProcedure // Consider making this a public procedure
    .route({
      method: 'POST',
      path: '/v1/api-tokens/verify',
      tags: ['tokens'],
      summary: 'Verify an API token',
    })
    .input(
      z.object({
        token: z.string(),
        accountId: z.string().optional(),
        userId: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const hash = await getApiTokenHash(input.token)

      const token = await db.query.ApiToken.findFirst({
        where: eq(ApiToken.hash, hash),
      })

      if (!token) {
        return { isValid: false }
      }

      if (!token.enabled) {
        return { isValid: false }
      }

      const now = new Date()
      if (token.expiresAt && token.expiresAt < now) {
        return { isValid: false }
      }
      if (token.notBefore && token.notBefore > now) {
        return { isValid: false }
      }

      return { isValid: true }
    }),

  delete: userPlainProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/v1/api-tokens/{id}',
      tags: ['tokens'],
      summary: 'Delete an API token',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const token = await db.query.ApiToken.findFirst({
        where: eq(ApiToken.id, input.id),
      })

      if (!token) {
        throw new ORPCError('NOT_FOUND', { message: 'API token not found' })
      }

      await context.auth.requirePermissions(
        token.scope === 'account' ? { apiToken: ['write'] } : { userApiToken: ['write'] },
        { accountId: token.accountId, userId: token.userId },
      )

      await db.delete(ApiToken).where(eq(ApiToken.id, input.id))

      return {
        token: formatApiToken(token),
      }
    }),
}

async function validateTokenPolicies(scope: ApiTokenScope, policies: TokenPolicy[]) {
  const accountIds = new Set<string>()
  const userIds = new Set<string>()
  let needsUserScope = false

  for (const policy of policies) {
    const allowedScopes = new Set<string>()
    for (const resource of Object.keys(policy.resources)) {
      const parts = resource.substring('dev.cared.api.'.length).split('.')
      const resourceType = parts[0]
      switch (resourceType) {
        case 'account':
          if (parts[1] === '*') {
            needsUserScope = true
          } else {
            accountIds.add(parts[1]!)
          }
          allowedScopes.add('dev.cared.api.account')
          break
        case 'user':
          userIds.add(parts[1]!)
          needsUserScope = true
          allowedScopes.add('dev.cared.api.user')
          break
        case 'ai':
          accountIds.add(parts[1]!)
          userIds.add(parts[2]!)
          allowedScopes.add('dev.cared.api.ai')
          break
      }
    }

    policy.permissionGroups.forEach((p) => {
      const pg = PERMISSION_GROUPS_MAP.get(p.id)
      if (!pg) {
        throw new ORPCError('BAD_REQUEST', {
          message: `Permission group ${p.id} not found.`,
        })
      }
      if (!pg.scopes.some((pgScope) => allowedScopes.has(pgScope))) {
        throw new ORPCError('BAD_REQUEST', {
          message: `Permission group ${p.id} requires at least one resource scope in: ${pg.scopes.join(', ')}.`,
        })
      }
    })
  }

  if (scope === 'user') {
    if (userIds.size !== 1) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Policies for user scope must have exactly one userId.',
      })
    }
    const userId = userIds.values().next().value!

    const allAccounts = await getUserAccounts(userId)
    const allAccountsMap = new Map(allAccounts.map((account) => [account.id, account]))
    accountIds.forEach((id) => {
      const account = allAccountsMap.get(id)
      if (!account) {
        throw new ORPCError('BAD_REQUEST', {
          message: `Account ${id} not found.`,
        })
      }
      const success = checkPermissionsByRole(account.role, { apiToken: ['write'] })
      if (!success) {
        throw new ORPCError('BAD_REQUEST', {
          message: `You have no permission to create API tokens for account ${account.id}.`,
        })
      }
    })

    return {
      scope,
      userId,
      accountIds: Array.from(accountIds),
    }
  } else {
    if (accountIds.size !== 1) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Policies for account scope must have exactly one accountId.',
      })
    }
    if (userIds.size > 1) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Policies for account scope cannot have multiple different userIds.',
      })
    }
    if (needsUserScope) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Policies for account scope cannot have any user scope resource.',
      })
    }

    return {
      scope,
      accountId: accountIds.values().next().value!,
      userId: userIds.values().next().value,
    }
  }
}
