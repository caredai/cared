import { modelPresetSchema } from '@tavern/core'
import { ModelPreset } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { userProtectedProcedure } from '../trpc'

export const modelPresetRouter = {
  list: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/model-presets',
        protect: true,
        tags: ['model-preset'],
        summary: 'List all model presets saved by user',
      },
    })
    .query(async ({ ctx }) => {
      const userId = ctx.auth.userId
      const modelPresets = await ctx.db.query.ModelPreset.findMany({
        where: eq(ModelPreset.userId, userId),
        orderBy: desc(ModelPreset.id),
      })
      return { modelPresets }
    }),

  get: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/model-presets/{id}',
        protect: true,
        tags: ['model-preset'],
        summary: 'Get a specific model preset by user',
      },
    })
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId
      const modelPreset = await ctx.db.query.ModelPreset.findFirst({
        where: and(eq(ModelPreset.id, input.id), eq(ModelPreset.userId, userId)),
      })
      if (!modelPreset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Model preset not found',
        })
      }
      return { modelPreset }
    }),

  create: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/model-presets',
        protect: true,
        tags: ['model-preset'],
        summary: 'Create a new model preset for user',
      },
    })
    .input(
      z.object({
        preset: modelPresetSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      const [modelPreset] = await ctx.db
        .insert(ModelPreset)
        .values({
          userId,
          preset: input.preset,
        })
        .returning()

      if (!modelPreset) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create model preset',
        })
      }

      return { modelPreset: modelPreset }
    }),

  update: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/model-presets/{id}',
        protect: true,
        tags: ['model-preset'],
        summary: 'Update an existing model preset for user',
      },
    })
    .input(
      z.object({
        id: z.string(),
        preset: modelPresetSchema
          .partial()
          .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      const existing = await ctx.db.query.ModelPreset.findFirst({
        where: and(eq(ModelPreset.id, input.id), eq(ModelPreset.userId, userId)),
      })
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Model preset not found',
        })
      }

      const preset = { ...existing.preset, ...input.preset }

      const [updatedModelPreset] = await ctx.db
        .update(ModelPreset)
        .set({
          preset,
        })
        .where(eq(ModelPreset.id, input.id))
        .returning()

      if (!updatedModelPreset) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update model preset',
        })
      }

      return { modelPreset: updatedModelPreset }
    }),

  delete: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/model-presets/{id}',
        protect: true,
        tags: ['model-preset'],
        summary: 'Delete a model preset for user',
      },
    })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      const existing = await ctx.db.query.ModelPreset.findFirst({
        columns: { id: true },
        where: and(eq(ModelPreset.id, input.id), eq(ModelPreset.userId, userId)),
      })
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Model preset not found',
        })
      }

      await ctx.db
        .delete(ModelPreset)
        .where(and(eq(ModelPreset.id, input.id), eq(ModelPreset.userId, userId)))
    }),
}
