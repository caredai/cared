import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import { and, asc, desc, eq, gt, lt } from '@cared/db'
import { Artifact, ArtifactSuggestion, Chat } from '@cared/db/schema'

import type { UserContext } from '../orpc'
import { userProtectedProcedure } from '../orpc'

async function verifyUserChat(ctx: UserContext, chatId: string) {
  const chat = await ctx.db.query.Chat.findFirst({
    where: eq(Chat.id, chatId),
  })

  if (chat?.userId !== ctx.auth.userId) {
    throw new ORPCError('NOT_FOUND', {
      message: `Chat with id ${chatId} not found`,
    })
  }

  return chat
}

async function verifyUserArtifact(ctx: UserContext, artifactId: string) {
  const artifact = await ctx.db.query.Artifact.findFirst({
    where: eq(Artifact.id, artifactId),
    with: {
      chat: true,
    },
  })

  if (artifact?.userId !== ctx.auth.userId) {
    throw new ORPCError('NOT_FOUND', {
      message: `Artifact with id ${artifactId} not found`,
    })
  }

  return artifact
}

export const artifactRouter = {
  /**
   * List all artifacts (of only latest version) for a chat.
   * Only accessible by authenticated users.
   */
  listByChat: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/artifacts',
      tags: ['artifacts'],
      summary: 'List all artifacts (of only latest version) for a chat',
    })
    .input(
      z
        .object({
          chatId: z.string().min(32),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          order: z.enum(['desc', 'asc']).default('desc'),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .handler(async ({ context, input }) => {
      await verifyUserChat(context, input.chatId)

      const conditions: SQL<unknown>[] = [eq(Artifact.chatId, input.chatId)]

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Artifact.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Artifact.id, input.before))
      }

      // Fetch artifacts with appropriate ordering
      const artifacts = await context.db
        .selectDistinctOn([Artifact.id])
        .from(Artifact)
        .where(and(...conditions))
        .orderBy(
          input.order === 'desc' ? desc(Artifact.id) : asc(Artifact.id),
          desc(Artifact.version),
        )
        .limit(input.limit + 1)

      const hasMore = artifacts.length > input.limit
      if (hasMore) {
        artifacts.pop()
      }

      // Get first and last artifact IDs
      const first = artifacts[0]?.id
      const last = artifacts[artifacts.length - 1]?.id

      return {
        artifacts,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * List all versions of an artifact by ID.
   * Only accessible by authenticated users.
   */
  listVersionsById: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/artifacts/{id}/versions',
      tags: ['artifacts'],
      summary: 'List all versions of an artifact by ID',
    })
    .input(
      z
        .object({
          id: z.string(),
          after: z.number().optional(),
          before: z.number().optional(),
          limit: z.number().min(1).max(100).default(50),
          order: z.enum(['desc', 'asc']).default('desc'),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .handler(async ({ context, input }) => {
      await verifyUserArtifact(context, input.id)

      const conditions: SQL<unknown>[] = [eq(Artifact.id, input.id)]

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Artifact.version, input.after))
      }
      if (input.before) {
        conditions.push(lt(Artifact.version, input.before))
      }

      const versions = await context.db.query.Artifact.findMany({
        where: and(...conditions),
        orderBy: input.order === 'desc' ? desc(Artifact.version) : asc(Artifact.version),
        limit: input.limit + 1,
      })

      const hasMore = versions.length > input.limit
      if (hasMore) {
        versions.pop()
      }

      if (!versions.length) {
        throw new ORPCError('NOT_FOUND', {
          message: `Artifact with id ${input.id} not found`,
        })
      }

      // Get first and last version numbers
      const first = versions[0]?.version
      const last = versions[versions.length - 1]?.version

      return {
        versions,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Delete all versions of an artifact after the specified version.
   * Only accessible by authenticated users.
   */
  deleteVersionsByIdAfterVersion: userProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/v1/artifacts/{id}/versions',
      tags: ['artifacts'],
      summary: 'Delete all versions of an artifact after the specified version',
    })
    .input(
      z.object({
        id: z.string(),
        after: z.number(),
      }),
    )
    .handler(async ({ context, input }) => {
      await verifyUserArtifact(context, input.id)

      return await context.db.transaction(async (tx) => {
        // Delete related suggestions first
        await tx
          .delete(ArtifactSuggestion)
          .where(
            and(
              eq(ArtifactSuggestion.artifactId, input.id),
              gt(ArtifactSuggestion.artifactVersion, input.after),
            ),
          )

        // Then delete artifact versions
        await tx
          .delete(Artifact)
          .where(and(eq(Artifact.id, input.id), gt(Artifact.version, input.after)))
      })
    }),

  /**
   * List suggestions for an artifact.
   * Only accessible by authenticated users.
   */
  listSuggestions: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/artifacts/suggestions',
      tags: ['artifacts'],
      summary: 'List suggestions for an artifact',
    })
    .input(
      z
        .object({
          artifactId: z.string(),
          artifactVersion: z.number().optional(),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          order: z.enum(['desc', 'asc']).default('desc'),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .handler(async ({ context, input }) => {
      await verifyUserArtifact(context, input.artifactId)

      const conditions: SQL<unknown>[] = [
        eq(ArtifactSuggestion.artifactId, input.artifactId),
      ]
      if (input.artifactVersion) {
        conditions.push(eq(ArtifactSuggestion.artifactVersion, input.artifactVersion))
      }

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(ArtifactSuggestion.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(ArtifactSuggestion.id, input.before))
      }

      const suggestions = await context.db.query.ArtifactSuggestion.findMany({
        where: and(...conditions),
        orderBy: input.order === 'desc' ? desc(ArtifactSuggestion.id) : asc(ArtifactSuggestion.id),
        limit: input.limit + 1,
      })

      const hasMore = suggestions.length > input.limit
      if (hasMore) {
        suggestions.pop()
      }

      // Get first and last suggestion IDs
      const first = suggestions[0]?.id
      const last = suggestions[suggestions.length - 1]?.id

      return {
        suggestions,
        hasMore,
        first,
        last,
      }
    }),
}
