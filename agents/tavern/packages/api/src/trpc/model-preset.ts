import { defaultModelPreset, modelPresetCustomizationSchema, modelPresetSchema } from '@tavern/core'
import { ModelPreset } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod/v4'

import { userProtectedProcedure } from '../trpc'

function sanitizeObject(preset: ModelPreset) {
  return {
    ...preset,
    customization: preset.customization ?? undefined,
  }
}

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

      if (!modelPresets.length) {
        const modelPreset = (
          await ctx.db
            .insert(ModelPreset)
            .values({
              userId: userId,
              name: 'Default',
              preset: defaultModelPreset,
            })
            .returning()
        ).at(0)!
        modelPresets.push(modelPreset)
      }

      return { modelPresets: modelPresets.map(sanitizeObject) }
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
      return { modelPreset: sanitizeObject(modelPreset) }
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
        name: z.string().min(1),
        preset: modelPresetSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      const [modelPreset] = await ctx.db
        .insert(ModelPreset)
        .values({
          userId,
          name: input.name,
          preset: input.preset,
        })
        .returning()

      if (!modelPreset) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create model preset',
        })
      }

      return { modelPreset: sanitizeObject(modelPreset) }
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
      z
        .object({
          id: z.string(),
          preset: modelPresetSchema
            .partial()
            .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided')
            .optional(),
          customization: modelPresetCustomizationSchema.nullable().optional(),
        })
        .refine(
          (data) => {
            const hasPreset = data.preset !== undefined
            const hasCustomization = data.customization !== undefined
            const clearCustomization = data.customization === null
            return (
              (hasPreset && (!hasCustomization || clearCustomization)) ||
              (!hasPreset && hasCustomization)
            )
          },
          {
            message:
              'Either preset or customization must be provided, but not both (unless clearing customization with null value)',
            path: ['preset', 'customization'],
          },
        ),
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

      const [updatedModelPreset] = await ctx.db
        .update(ModelPreset)
        .set({
          ...(input.preset && { preset: { ...existing.preset, ...input.preset } }),
          ...(input.customization !== undefined && {
            customization: input.customization,
          }),
        })
        .where(eq(ModelPreset.id, input.id))
        .returning()

      if (!updatedModelPreset) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update model preset',
        })
      }

      return {
        modelPreset: sanitizeObject(updatedModelPreset)
      }
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

      const num = await ctx.db
        .select({ count: count() })
        .from(ModelPreset)
        .where(eq(ModelPreset.userId, userId))
        .then((r) => r[0]!.count)
      if (num <= 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete the last model preset',
        })
      }

      await ctx.db
        .delete(ModelPreset)
        .where(and(eq(ModelPreset.id, input.id), eq(ModelPreset.userId, userId)))
    }),
}
