import { themeSchema } from '@tavern/core'
import { Theme } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { userProtectedProcedure } from '../trpc'

export const themeRouter = {
  list: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/themes',
        protect: true,
        tags: ['theme'],
        summary: 'List all themes saved by user',
      },
    })
    .query(async ({ ctx }) => {
      const userId = ctx.auth.userId
      const themes = await ctx.db.query.Theme.findMany({
        where: eq(Theme.userId, userId),
        orderBy: desc(Theme.id),
      })
      return { themes }
    }),

  get: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/themes/{id}',
        protect: true,
        tags: ['theme'],
        summary: 'Get a specific theme by user',
      },
    })
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId
      const theme = await ctx.db.query.Theme.findFirst({
        where: and(eq(Theme.id, input.id), eq(Theme.userId, userId)),
      })

      if (!theme) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Theme not found',
        })
      }
      return { theme }
    }),

  create: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/themes',
        protect: true,
        tags: ['theme'],
        summary: 'Create a new theme for user',
      },
    })
    .input(
      z.object({
        theme: themeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      const [theme] = await ctx.db
        .insert(Theme)
        .values({
          userId,
          theme: input.theme,
        })
        .returning()

      if (!theme) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create theme',
        })
      }

      return { theme: theme }
    }),

  update: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/themes/{id}',
        protect: true,
        tags: ['theme'],
        summary: 'Update an existing theme for user',
      },
    })
    .input(
      z.object({
        id: z.string(),
        theme: themeSchema
          .partial()
          .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      const existing = await ctx.db.query.Theme.findFirst({
        where: and(eq(Theme.id, input.id), eq(Theme.userId, userId)),
      })
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Theme not found or access denied',
        })
      }

      const theme = { ...existing.theme, ...input.theme }

      const [updatedTheme] = await ctx.db
        .update(Theme)
        .set({
          theme,
        })
        .where(eq(Theme.id, input.id))
        .returning()

      if (!updatedTheme) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update theme',
        })
      }

      return { theme: updatedTheme }
    }),

  delete: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/themes/{id}',
        protect: true,
        tags: ['theme'],
        summary: 'Delete a theme for user',
      },
    })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      const existing = await ctx.db.query.Theme.findFirst({
        columns: { id: true },
        where: and(eq(Theme.id, input.id), eq(Theme.userId, userId)),
      })
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Theme not found',
        })
      }

      await ctx.db.delete(Theme).where(and(eq(Theme.id, input.id), eq(Theme.userId, userId)))
    }),
}
