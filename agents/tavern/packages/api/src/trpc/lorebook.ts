import path from 'path'
import type { LorebookContent } from '@tavern/core'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { lorebookEntriesSchema, lorebookEntrySchema } from '@tavern/core'
import { and, desc, eq } from '@tavern/db'
import {
  Lorebook,
  LorebookToCharacter,
  LorebookToChat,
  LorebookToGroup,
  LorebookToPersona,
} from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import sanitize from 'sanitize-filename'
import { v7 as uuid } from 'uuid'
import { z } from 'zod/v4'

import { env } from '../env'
import { s3Client } from '../s3'
import { userProtectedProcedure } from '../trpc'
import { omitUserId } from '../utils'

export async function uploadLorebook(content: LorebookContent) {
  let name = content.name
  name = name.endsWith('.json') ? name : `${name}.json`
  const key = `lorebooks/${uuid()}/${sanitize(name)}`
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: JSON.stringify(content),
    ContentType: 'application/json',
  })
  await s3Client.send(command)
  return path.posix.join(env.S3_BUCKET, key)
}

export const lorebookRouter = {
  list: userProtectedProcedure
    .input(
      z
        .object({
          includeEntries: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const lorebooks = await ctx.db.query.Lorebook.findMany({
        columns: {
          id: true,
          name: true,
          description: true,
          // Default to omitting `entries` field since it may be too big.
          entries: !!input?.includeEntries,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
        where: eq(Lorebook.userId, ctx.auth.userId),
        orderBy: desc(Lorebook.id),
        with: {
          lorebookToChats: true,
          lorebookToCharacters: true,
          lorebookToGroups: true,
          lorebookToPersonas: true,
        },
      })

      return {
        lorebooks: lorebooks.map(
          ({
            lorebookToChats,
            lorebookToCharacters,
            lorebookToGroups,
            lorebookToPersonas,
            ...lorebook
          }) => ({
            ...lorebook,
            chatIds: lorebookToChats.map((c) => c.chatId),
            characterIds: lorebookToCharacters.map((c) => c.characterId),
            groupIds: lorebookToGroups.map((g) => g.groupId),
            personaIds: lorebookToPersonas.map((p) => p.personaId),
            primaryCharacterIds: lorebookToCharacters
              .filter((c) => c.primary)
              .map((c) => c.characterId),
          }),
        ),
      } as {
        lorebooks: (Omit<Lorebook, 'userId' | 'entries'> &
          Partial<Pick<Lorebook, 'entries'>> & {
            chatIds: string[]
            characterIds: string[]
            groupIds: string[]
            personaIds: string[]
            primaryCharacterIds: string[]
          })[]
      }
    }),

  get: userProtectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const lorebook = await ctx.db.query.Lorebook.findFirst({
      where: and(eq(Lorebook.id, input.id), eq(Lorebook.userId, ctx.auth.userId)),
      with: {
        lorebookToChats: true,
        lorebookToCharacters: true,
        lorebookToGroups: true,
        lorebookToPersonas: true,
      },
    })
    if (!lorebook) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Lorebook not found',
      })
    }

    const {
      lorebookToCharacters,
      lorebookToGroups,
      lorebookToPersonas,
      lorebookToChats,
      ...lorebookData
    } = lorebook
    return {
      lorebook: {
        ...omitUserId(lorebookData),
        chatIds: lorebookToChats.map((c) => c.chatId),
        characterIds: lorebookToCharacters.map((c) => c.characterId),
        groupIds: lorebookToGroups.map((g) => g.groupId),
        personaIds: lorebookToPersonas.map((p) => p.personaId),
        primaryCharacterIds: lorebookToCharacters
          .filter((c) => c.primary)
          .map((c) => c.characterId),
      },
    }
  }),

  create: userProtectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        entries: z.array(lorebookEntrySchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [lorebook] = await ctx.db
        .insert(Lorebook)
        .values({
          userId: ctx.auth.userId,
          name: input.name,
          description: input.description,
          entries: input.entries ?? [],
        })
        .returning()
      return {
        lorebook: {
          ...omitUserId(lorebook!),
          chatIds: [],
          characterIds: [],
          groupIds: [],
          personaIds: [],
          primaryCharacterIds: [],
        },
      }
    }),

  update: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        entries: lorebookEntriesSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lorebook = await ctx.db.query.Lorebook.findFirst({
        where: and(eq(Lorebook.id, input.id), eq(Lorebook.userId, ctx.auth.userId)),
      })
      if (!lorebook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lorebook not found',
        })
      }

      const updates = {
        ...(input.name && { name: input.name }),
        ...(input.entries && {
          entries: input.entries,
        }),
      }

      await ctx.db.update(Lorebook).set(updates).where(eq(Lorebook.id, input.id))

      // Do not return lorebook here since it may be too big.
    }),

  delete: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [lorebook] = await ctx.db
        .delete(Lorebook)
        .where(and(eq(Lorebook.id, input.id), eq(Lorebook.userId, ctx.auth.userId)))
        .returning()
      if (!lorebook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lorebook not found',
        })
      }
    }),

  link: userProtectedProcedure
    .input(
      z.object({
        lorebookId: z.string(),
        chatId: z.string().optional(),
        characterId: z.string().optional(),
        primaryCharacterId: z.string().optional(),
        groupId: z.string().optional(),
        personaId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        // Verify lorebook exists and belongs to user
        const lorebook = await tx.query.Lorebook.findFirst({
          where: and(eq(Lorebook.id, input.lorebookId), eq(Lorebook.userId, ctx.auth.userId)),
        })
        if (!lorebook) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lorebook not found',
          })
        }

        // Link to chat if provided
        // Chat can only be linked to one lorebook, so unlink from any existing lorebook first
        if (input.chatId) {
          // Remove existing link for this chat
          await tx
            .delete(LorebookToChat)
            .where(
              and(
                eq(LorebookToChat.chatId, input.chatId),
                eq(LorebookToChat.userId, ctx.auth.userId),
              ),
            )

          // Create new link
          await tx.insert(LorebookToChat).values({
            lorebookId: input.lorebookId,
            chatId: input.chatId,
            userId: ctx.auth.userId,
          })
        }

        // Link to character if provided
        if (input.characterId) {
          // Check if the character is already linked to this lorebook
          const existingCharacterLink = await tx.query.LorebookToCharacter.findFirst({
            where: and(
              eq(LorebookToCharacter.lorebookId, input.lorebookId),
              eq(LorebookToCharacter.characterId, input.characterId),
              eq(LorebookToCharacter.userId, ctx.auth.userId),
            ),
          })

          // Only create link if it doesn't exist
          if (!existingCharacterLink) {
            await tx.insert(LorebookToCharacter).values({
              lorebookId: input.lorebookId,
              characterId: input.characterId,
              userId: ctx.auth.userId,
              primary: false,
            })
          }
        }

        // Set primary character if provided
        if (input.primaryCharacterId) {
          // Check if the character is linked to this lorebook
          const characterLink = await tx.query.LorebookToCharacter.findFirst({
            where: and(
              eq(LorebookToCharacter.lorebookId, input.lorebookId),
              eq(LorebookToCharacter.characterId, input.primaryCharacterId),
              eq(LorebookToCharacter.userId, ctx.auth.userId),
            ),
          })

          if (!characterLink?.primary) {
            // If there is a primary character already linked, remove it
            await tx
              .delete(LorebookToCharacter)
              .where(
                and(
                  eq(LorebookToCharacter.characterId, input.primaryCharacterId),
                  eq(LorebookToCharacter.userId, ctx.auth.userId),
                  eq(LorebookToCharacter.primary, true),
                ),
              )
          }

          if (!characterLink) {
            // Create new link if it doesn't exist
            await tx.insert(LorebookToCharacter).values({
              lorebookId: input.lorebookId,
              characterId: input.primaryCharacterId,
              userId: ctx.auth.userId,
              primary: true,
            })
          } else if (!characterLink.primary) {
            // Set the link to this lorebook as primary
            await tx
              .update(LorebookToCharacter)
              .set({ primary: true })
              .where(
                and(
                  eq(LorebookToCharacter.lorebookId, input.lorebookId),
                  eq(LorebookToCharacter.characterId, input.primaryCharacterId),
                  eq(LorebookToCharacter.userId, ctx.auth.userId),
                ),
              )
          }
        }

        // Link to group if provided
        if (input.groupId) {
          // Check if the group is already linked to this lorebook
          const existingGroupLink = await tx.query.LorebookToGroup.findFirst({
            where: and(
              eq(LorebookToGroup.lorebookId, input.lorebookId),
              eq(LorebookToGroup.groupId, input.groupId),
              eq(LorebookToGroup.userId, ctx.auth.userId),
            ),
          })

          // Only create link if it doesn't exist
          if (!existingGroupLink) {
            await tx.insert(LorebookToGroup).values({
              lorebookId: input.lorebookId,
              groupId: input.groupId,
              userId: ctx.auth.userId,
            })
          }
        }

        // Link to persona if provided
        // Persona can only be linked to one lorebook, so unlink from any existing lorebook first
        if (input.personaId) {
          // Remove existing link for this persona
          await tx
            .delete(LorebookToPersona)
            .where(
              and(
                eq(LorebookToPersona.personaId, input.personaId),
                eq(LorebookToPersona.userId, ctx.auth.userId),
              ),
            )

          // Create new link
          await tx.insert(LorebookToPersona).values({
            lorebookId: input.lorebookId,
            personaId: input.personaId,
            userId: ctx.auth.userId,
          })
        }
      })
    }),

  unlink: userProtectedProcedure
    .input(
      z.object({
        lorebookId: z.string(),
        chatId: z.string().optional(),
        characterId: z.string().optional(),
        groupId: z.string().optional(),
        personaId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        // Verify lorebook exists and belongs to user
        const lorebook = await tx.query.Lorebook.findFirst({
          where: and(eq(Lorebook.id, input.lorebookId), eq(Lorebook.userId, ctx.auth.userId)),
        })
        if (!lorebook) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lorebook not found',
          })
        }

        // Unlink from chat if provided
        if (input.chatId) {
          await tx
            .delete(LorebookToChat)
            .where(
              and(
                eq(LorebookToChat.lorebookId, input.lorebookId),
                eq(LorebookToChat.chatId, input.chatId),
                eq(LorebookToChat.userId, ctx.auth.userId),
              ),
            )
        }

        // Unlink from character if provided
        if (input.characterId) {
          await tx
            .delete(LorebookToCharacter)
            .where(
              and(
                eq(LorebookToCharacter.lorebookId, input.lorebookId),
                eq(LorebookToCharacter.characterId, input.characterId),
                eq(LorebookToCharacter.userId, ctx.auth.userId),
              ),
            )
        }

        // Unlink from group if provided
        if (input.groupId) {
          await tx
            .delete(LorebookToGroup)
            .where(
              and(
                eq(LorebookToGroup.lorebookId, input.lorebookId),
                eq(LorebookToGroup.groupId, input.groupId),
                eq(LorebookToGroup.userId, ctx.auth.userId),
              ),
            )
        }

        // Unlink from persona if provided
        if (input.personaId) {
          await tx
            .delete(LorebookToPersona)
            .where(
              and(
                eq(LorebookToPersona.lorebookId, input.lorebookId),
                eq(LorebookToPersona.personaId, input.personaId),
                eq(LorebookToPersona.userId, ctx.auth.userId),
              ),
            )
        }
      })
    }),
}
