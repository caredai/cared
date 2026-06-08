import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import { PERMISSION_GROUPS, validateTokenPolicies } from '@cared/auth'
import { and, asc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { ApiToken, apiTokenCredentialTypes } from '@cared/db/schema'
import { TokenPolicy, tokenPolicySchema } from '@cared/shared'

import {
  formatApiToken,
  generateApiToken,
  getApiTokenHash,
  getUserAccounts,
  invalidateApiTokenCache,
} from '../../operation'
import { userPlainProtectedProcedure } from '../../orpc'

export const apiTokenRouter = {
  listPermissionGroups: userPlainProtectedProcedure
    .route({
      method: 'GET',
      path: '/api-tokens/permission-groups',
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
      path: '/api-tokens',
      tags: ['tokens'],
      summary: 'List all API tokens for an account',
    })
    .input(
      z.object({
        credentialType: z.enum(apiTokenCredentialTypes),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ apiToken: ['read'] })

      const tokens = await db
        .select()
        .from(ApiToken)
        .where(
          and(
            eq(ApiToken.credentialType, input.credentialType),
            input.credentialType === 'account'
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
      path: '/api-tokens/{id}',
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
        { apiToken: ['read'] },
        { accountId: token.accountId, userId: token.userId },
      )

      return {
        token: formatApiToken(token),
      }
    }),

  create: userPlainProtectedProcedure
    .route({
      method: 'POST',
      path: '/api-tokens',
      tags: ['tokens'],
      summary: 'Create a new API token',
    })
    .input(
      z
        .object({
          credentialType: z.enum(apiTokenCredentialTypes),
          name: z.string().min(1).max(64),
          policies: z.array(tokenPolicySchema).min(1),
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
      let validated: Awaited<ReturnType<typeof validateTokenPolicies>>
      try {
        validated = await validateTokenPolicies(
          input.credentialType,
          input.policies,
          getUserAccounts,
          context.auth.userId,
        )
      } catch (error) {
        throw new ORPCError('BAD_REQUEST', {
          message: error instanceof Error ? error.message : 'Invalid token policies',
        })
      }
      const { credentialType, formattedPolicies, userId, accountId } = validated

      await context.auth.requirePermissions(
        { apiToken: ['write'] },
        credentialType === 'account'
          ? {
              accountId,
            }
          : {
              userId,
            },
      )

      const { token, hash, start, end } = await generateApiToken(credentialType)

      const [newToken] = await db
        .insert(ApiToken)
        .values({
          name: input.name,
          hash,
          policies: formattedPolicies,
          enabled: input.enabled ?? true,
          expiresAt: input.expiresAt,
          notBefore: input.notBefore,
          metadata: {
            start,
            end,
          },
          credentialType,
          accountId: credentialType === 'account' ? accountId : undefined,
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

  update: userPlainProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/api-tokens/{id}',
      tags: ['tokens'],
      summary: 'Update an API token',
    })
    .input(
      z
        .object({
          id: z.string(),
          name: z.string().min(1).max(64).optional(),
          policies: z.array(tokenPolicySchema).min(1).optional(),
          enabled: z.boolean().optional(),
          expiresAt: z.date().nullish(),
          notBefore: z.date().nullish(),
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
      const existingToken = await db.query.ApiToken.findFirst({
        where: eq(ApiToken.id, input.id),
      })

      if (!existingToken) {
        throw new ORPCError('NOT_FOUND', { message: 'API token not found' })
      }

      let formattedPolicies: TokenPolicy[] | undefined
      if (input.policies) {
        let validated: Awaited<ReturnType<typeof validateTokenPolicies>>
        try {
          validated = await validateTokenPolicies(
            existingToken.credentialType,
            input.policies,
            getUserAccounts,
            context.auth.userId,
          )
        } catch (error) {
          throw new ORPCError('BAD_REQUEST', {
            message: error instanceof Error ? error.message : 'Invalid token policies',
          })
        }

        if (existingToken.credentialType === 'account') {
          if (validated.accountId !== existingToken.accountId) {
            throw new ORPCError('BAD_REQUEST', {
              message: 'Cannot change the account this API token is bound to',
            })
          }
          if ((validated.userId ?? null) !== (existingToken.userId ?? null)) {
            throw new ORPCError('BAD_REQUEST', {
              message: 'Cannot change the member this API token is bound to',
            })
          }
        } else {
          if (validated.userId !== existingToken.userId) {
            throw new ORPCError('BAD_REQUEST', {
              message: 'Cannot change the user this API token is bound to',
            })
          }
        }

        formattedPolicies = validated.formattedPolicies
      }

      await context.auth.requirePermissions(
        { apiToken: ['write'] },
        existingToken.credentialType === 'account'
          ? {
              accountId: existingToken.accountId,
            }
          : {
              userId: existingToken.userId,
            },
      )

      const [updatedToken] = await db
        .update(ApiToken)
        .set({
          name: input.name,
          policies: formattedPolicies,
          enabled: input.enabled,
          expiresAt: input.expiresAt,
          notBefore: input.notBefore,
        })
        .where(eq(ApiToken.id, input.id))
        .returning()

      await invalidateApiTokenCache(existingToken.hash)

      return {
        token: formatApiToken(updatedToken!),
      }
    }),

  rotate: userPlainProtectedProcedure
    .route({
      method: 'POST',
      path: '/api-tokens/{id}/rotate',
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
        { apiToken: ['write'] },
        { accountId: existingToken.accountId, userId: existingToken.userId },
      )

      const { token, hash, start, end } = await generateApiToken(existingToken.credentialType)

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
      path: '/api-tokens/verify',
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
      path: '/api-tokens/{id}',
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
        { apiToken: ['write'] },
        { accountId: token.accountId, userId: token.userId },
      )

      await db.delete(ApiToken).where(eq(ApiToken.id, input.id))

      return {
        token: formatApiToken(token),
      }
    }),
}
