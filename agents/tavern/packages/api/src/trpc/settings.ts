import { fillInSettingsWithDefaults, settingsSchema } from '@tavern/core'
import { UserSettings } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import hash from 'stable-hash'
import { z } from 'zod'

import { userProtectedProcedure } from '../trpc'

export const settingsRouter = {
  get: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/settings',
        protect: true,
        tags: ['settings'],
        summary: 'Get user settings',
      },
    })
    .query(async ({ ctx }) => {
      const userId = ctx.auth.userId

      const userSettings = await ctx.db.query.UserSettings.findFirst({
        where: eq(UserSettings.userId, userId),
      })

      let settings = userSettings?.settings
      if (!settings) {
        // If the settings not found, create it with defaults.
        settings = (
          await ctx.db
            .insert(UserSettings)
            .values({
              userId: userId,
              settings: fillInSettingsWithDefaults({}),
            })
            .returning()
        ).at(0)!.settings
      } else {
        const newSettings = fillInSettingsWithDefaults(settings)
        // If the settings not up to date, update it.
        if (hash(settings) !== hash(newSettings)) {
          settings = (
            await ctx.db
              .update(UserSettings)
              .set({
                settings: newSettings,
              })
              .where(eq(UserSettings.userId, userId))
              .returning()
          ).at(0)!.settings
        }
      }

      return {
        settings,
      }
    }),

  update: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/settings',
        protect: true,
        tags: ['settings'],
        summary: 'Update user settings',
      },
    })
    .input(
      z.object({
        settings: settingsSchema
          .partial()
          .refine((data) => Object.keys(data).length > 0, 'At least one setting must be provided'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      const userSettings = await ctx.db.query.UserSettings.findFirst({
        where: eq(UserSettings.userId, userId),
      })
      if (!userSettings) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User settings not found',
        })
      }

      const { settings } = (
        await ctx.db
          .update(UserSettings)
          .set({
            settings: {
              ...userSettings.settings,
              ...input.settings,
            },
          })
          .where(eq(UserSettings.userId, userId))
          .returning()
      ).at(0)!

      return { settings }
    }),
}
