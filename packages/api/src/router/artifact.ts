import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { SQL } from '@ownxai/db'
import { and, asc, desc, eq, gt, lt } from '@ownxai/db'
import { Artifact, ArtifactSuggestion, Chat } from '@ownxai/db/schema'

import type { Context } from '../trpc'
import { userProtectedProcedure } from '../trpc'

async function verifyUserChat(ctx: Context, chatId: string) {
  const chat = await ctx.db.query.Chat.findFirst({
    where: eq(Chat.id, chatId),
  })

  if (chat?.userId !== ctx.auth.userId) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Chat with id ${chatId} not found`,
    })
  }

  return chat
}

async function verifyUserArtifact(ctx: Context, artifactId: string) {
  const artifact = await ctx.db.query.Artifact.findFirst({
    where: eq(Artifact.id, artifactId),
    with: {
      chat: true,
    },
  })

  if (artifact?.userId !== ctx.auth.userId) {
    throw new TRPCError({
      code: 'NOT_FOUND',
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
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/artifacts',
        protect: true,
        tags: ['artifacts'],
        summary: 'List all artifacts (of only latest version) for a chat',
      },
    })
    .input(
      z
        .object({
          chatId: z.string().min(32),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .query(async ({ ctx, input }) => {
      await verifyUserChat(ctx, input.chatId)

      const conditions: SQL<unknown>[] = [eq(Artifact.chatId, input.chatId)]

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Artifact.id, input.after))
      } else if (input.before) {
        conditions.push(lt(Artifact.id, input.before))
      }

      // Determine if this is backward pagination
      const isBackwardPagination = !!input.before

      // Fetch artifacts with appropriate ordering
      const artifacts = await ctx.db
        .selectDistinctOn([Artifact.id])
        .from(Artifact)
        .where(and(...conditions))
        .orderBy(
          isBackwardPagination ? asc(Artifact.id) : desc(Artifact.id),
          desc(Artifact.version),
        )
        .limit(input.limit + 1)

      const hasMore = artifacts.length > input.limit
      if (hasMore) {
        artifacts.pop()
      }

      // Reverse results for backward pagination to maintain consistent ordering
      const result = isBackwardPagination ? artifacts.reverse() : artifacts

      // Get first and last artifact IDs
      const first = result[0]?.id
      const last = result[result.length - 1]?.id

      return {
        artifacts: result,
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
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/artifacts/{id}/versions',
        protect: true,
        tags: ['artifacts'],
        summary: 'List all versions of an artifact by ID',
      },
    })
    .input(
      z
        .object({
          id: z.string(),
          after: z.number().optional(),
          before: z.number().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .query(async ({ ctx, input }) => {
      await verifyUserArtifact(ctx, input.id)

      const conditions: SQL<unknown>[] = [eq(Artifact.id, input.id)]

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Artifact.version, input.after))
      } else if (input.before) {
        conditions.push(lt(Artifact.version, input.before))
      }

      // Determine if this is backward pagination
      const isBackwardPagination = !!input.before

      // Fetch versions with appropriate ordering
      let versions
      if (isBackwardPagination) {
        versions = await ctx.db.query.Artifact.findMany({
          where: and(...conditions),
          orderBy: asc(Artifact.version),
          limit: input.limit + 1,
        })
      } else {
        versions = await ctx.db.query.Artifact.findMany({
          where: and(...conditions),
          orderBy: desc(Artifact.version),
          limit: input.limit + 1,
        })
      }

      const hasMore = versions.length > input.limit
      if (hasMore) {
        versions.pop()
      }

      // Reverse results for backward pagination to maintain consistent ordering
      versions = isBackwardPagination ? versions.reverse() : versions

      if (!versions.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
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
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/artifacts/{id}/versions',
        protect: true,
        tags: ['artifacts'],
        summary: 'Delete all versions of an artifact after the specified version',
      },
    })
    .input(
      z.object({
        id: z.string(),
        after: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyUserArtifact(ctx, input.id)

      return await ctx.db.transaction(async (tx) => {
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
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/artifacts/suggestions',
        protect: true,
        tags: ['artifacts'],
        summary: 'List suggestions for an artifact',
      },
    })
    .input(
      z
        .object({
          artifactId: z.string(),
          artifactVersion: z.number().optional(),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .query(async ({ ctx, input }) => {
      await verifyUserArtifact(ctx, input.artifactId)

      const conditions: SQL<unknown>[] = [
        eq(ArtifactSuggestion.artifactId, input.artifactId),
      ]
      if (input.artifactVersion) {
        conditions.push(eq(ArtifactSuggestion.artifactVersion, input.artifactVersion))
      }

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(ArtifactSuggestion.id, input.after))
      } else if (input.before) {
        conditions.push(lt(ArtifactSuggestion.id, input.before))
      }

      // Determine if this is backward pagination
      const isBackwardPagination = !!input.before

      // Fetch suggestions with appropriate ordering
      let suggestions
      if (isBackwardPagination) {
        suggestions = await ctx.db.query.ArtifactSuggestion.findMany({
          where: and(...conditions),
          orderBy: asc(ArtifactSuggestion.id),
          limit: input.limit + 1,
        })
      } else {
        suggestions = await ctx.db.query.ArtifactSuggestion.findMany({
          where: and(...conditions),
          orderBy: desc(ArtifactSuggestion.id),
          limit: input.limit + 1,
        })
      }

      const hasMore = suggestions.length > input.limit
      if (hasMore) {
        suggestions.pop()
      }

      // Reverse results for backward pagination to maintain consistent ordering
      suggestions = isBackwardPagination ? suggestions.reverse() : suggestions

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
