import { personaMetadataSchema } from '@tavern/core'
import {
  Character,
  CharGroup,
  Persona,
  PersonaToCharacter,
  PersonaToChat,
  PersonaToGroup,
  UserSettings,
} from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod/v4'

import { makeObjectNonempty } from '@ownxai/sdk'

import { createOwnxClient } from '../ownx'
import { userProtectedProcedure } from '../trpc'
import { deleteImage, deleteImages, uploadImage } from './utils'

// Helper function to process metadata and handle image upload
async function processMetadata(metadata: z.infer<typeof personaMetadataSchema>, name: string) {
  if (metadata.imageUrl?.startsWith('data:')) {
    const imageUrl = await uploadImage(metadata.imageUrl, {
      name: name,
      prefix: 'personas',
    })
    return {
      ...metadata,
      imageUrl,
    }
  }
  return metadata
}

export const personaRouter = {
  // List all personas for the current user with relations
  list: userProtectedProcedure.query(async ({ ctx }) => {
    const personas = await ctx.db.query.Persona.findMany({
      where: eq(Persona.userId, ctx.auth.userId),
      with: {
        personaToCharacters: true,
        personaToGroups: true,
        personaToChats: true,
      },
    })

    return {
      personas: personas.map(
        ({ personaToCharacters, personaToGroups, personaToChats, ...persona }) => ({
          ...persona,
          characters: personaToCharacters.map((c) => c.characterId),
          groups: personaToGroups.map((g) => g.groupId),
          chats: personaToChats.map((c) => c.chatId),
        }),
      ),
    }
  }),

  // Get a specific persona by ID
  get: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const persona = await ctx.db.query.Persona.findFirst({
        where: and(eq(Persona.id, input.id), eq(Persona.userId, ctx.auth.userId)),
        with: {
          personaToCharacters: true,
          personaToGroups: true,
          personaToChats: true,
        },
      })
      if (!persona) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Persona not found',
        })
      }

      const { personaToCharacters, personaToGroups, personaToChats, ...personaData } = persona
      return {
        persona: {
          ...personaData,
          characters: personaToCharacters.map((c) => c.characterId),
          groups: personaToGroups.map((g) => g.groupId),
          chats: personaToChats.map((c) => c.chatId),
        },
      }
    }),

  // Create a new persona
  create: userProtectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        metadata: personaMetadataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const metadata = await processMetadata(input.metadata, input.name)

      const [persona] = await ctx.db
        .insert(Persona)
        .values({
          userId: ctx.auth.userId,
          name: input.name,
          metadata,
        })
        .returning()
      if (!persona) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create persona',
        })
      }

      return { persona }
    }),

  // Batch create multiple personas
  batchCreate: userProtectedProcedure
    .input(
      z.object({
        personas: z.array(
          z.object({
            name: z.string().min(1),
            metadata: personaMetadataSchema.omit({
              imageUrl: true,
            }),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const values = input.personas.map((persona) => ({
        userId: ctx.auth.userId,
        name: persona.name,
        metadata: persona.metadata,
      }))

      const personas = await ctx.db.insert(Persona).values(values).returning()

      if (!personas.length) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create personas',
        })
      }

      return { personas }
    }),

  // Update an existing persona
  update: userProtectedProcedure
    .input(
      z
        .object({
          id: z.string(),
          name: z.string().optional(),
          metadata: makeObjectNonempty(personaMetadataSchema).optional(),
        })
        .refine((obj) => obj.name ?? obj.metadata, 'No fields to update'),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, metadata: partialMetadata } = input

      const persona = await ctx.db.query.Persona.findFirst({
        where: and(eq(Persona.id, id), eq(Persona.userId, ctx.auth.userId)),
      })
      if (!persona) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Persona not found',
        })
      }

      let metadata
      if (partialMetadata) {
        metadata = await processMetadata(
          {
            ...persona.metadata,
            ...partialMetadata,
          },
          name ?? persona.name,
        )

        if (persona.metadata.imageUrl && metadata.imageUrl !== persona.metadata.imageUrl) {
          await deleteImage(persona.metadata.imageUrl)
        }
      }

      const updates = {
        ...(name && { name }),
        ...(metadata && { metadata }),
      }

      const [updatedPersona] = await ctx.db
        .update(Persona)
        .set(updates)
        .where(eq(Persona.id, id))
        .returning()

      return { persona: updatedPersona! }
    }),

  // Delete a persona
  delete: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [persona] = await ctx.db
        .delete(Persona)
        .where(and(eq(Persona.id, input.id), eq(Persona.userId, ctx.auth.userId)))
        .returning()
      if (!persona) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Persona not found',
        })
      }

      // Delete the image if it exists
      if (persona.metadata.imageUrl) {
        await deleteImage(persona.metadata.imageUrl)
      }

      return { persona }
    }),

  // Batch delete personas
  batchDelete: userProtectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get all personas that belong to the user and match the provided IDs
      const personas = await ctx.db
        .select()
        .from(Persona)
        .where(and(eq(Persona.userId, ctx.auth.userId), inArray(Persona.id, input.ids)))
      if (personas.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No personas found',
        })
      }

      // Delete all personas from database
      await ctx.db
        .delete(Persona)
        .where(and(eq(Persona.userId, ctx.auth.userId), inArray(Persona.id, input.ids)))

      // Delete all images from storage
      const imageUrls = personas
        .map((persona) => persona.metadata.imageUrl)
        .filter((url): url is string => !!url)
      await deleteImages(imageUrls)

      return { personas }
    }),

  // Link persona to a character
  linkToCharacter: userProtectedProcedure
    .input(
      z.object({
        personaId: z.string(),
        characterId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Check if persona exists and belongs to user
        const persona = await tx.query.Persona.findFirst({
          where: and(eq(Persona.id, input.personaId), eq(Persona.userId, ctx.auth.userId)),
        })
        if (!persona) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Persona not found',
          })
        }

        // Check if character exists and belongs to user
        const character = await tx.query.Character.findFirst({
          where: and(eq(Character.id, input.characterId), eq(Character.userId, ctx.auth.userId)),
        })
        if (!character) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Character not found',
          })
        }

        // Get user settings to check allowMultiConnectionsPerCharacter
        const userSettings = await tx.query.UserSettings.findFirst({
          where: eq(UserSettings.userId, ctx.auth.userId),
        })

        const allowMultiConnections =
          userSettings?.settings.persona.allowMultiConnectionsPerCharacter ?? false

        // Only delete existing links if multi-connections are not allowed
        if (!allowMultiConnections) {
          await tx
            .delete(PersonaToCharacter)
            .where(
              and(
                eq(PersonaToCharacter.characterId, input.characterId),
                eq(PersonaToCharacter.userId, ctx.auth.userId),
              ),
            )
        }

        // Create new link
        const [link] = await tx
          .insert(PersonaToCharacter)
          .values({
            personaId: input.personaId,
            characterId: input.characterId,
            userId: ctx.auth.userId,
          })
          .returning()

        if (!link) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to link persona to character',
          })
        }

        return { link }
      })
    }),

  // Unlink persona from a character
  unlinkFromCharacter: userProtectedProcedure
    .input(
      z.object({
        personaId: z.string(),
        characterId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if persona exists and belongs to user
      const persona = await ctx.db.query.Persona.findFirst({
        where: and(eq(Persona.id, input.personaId), eq(Persona.userId, ctx.auth.userId)),
      })
      if (!persona) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Persona not found',
        })
      }

      // Check if character exists and belongs to user
      const character = await ctx.db.query.Character.findFirst({
        where: and(eq(Character.id, input.characterId), eq(Character.userId, ctx.auth.userId)),
      })
      if (!character) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Character not found',
        })
      }

      const [link] = await ctx.db
        .delete(PersonaToCharacter)
        .where(
          and(
            eq(PersonaToCharacter.personaId, input.personaId),
            eq(PersonaToCharacter.characterId, input.characterId),
            eq(PersonaToCharacter.userId, ctx.auth.userId),
          ),
        )
        .returning()
      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Persona-character link not found',
        })
      }
      return { link }
    }),

  // Link persona to a character group
  linkToGroup: userProtectedProcedure
    .input(
      z.object({
        personaId: z.string(),
        groupId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Check if persona exists and belongs to user
        const persona = await tx.query.Persona.findFirst({
          where: and(eq(Persona.id, input.personaId), eq(Persona.userId, ctx.auth.userId)),
        })
        if (!persona) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Persona not found',
          })
        }

        // Check if group exists and belongs to user
        const group = await tx.query.CharGroup.findFirst({
          where: and(eq(CharGroup.id, input.groupId), eq(CharGroup.userId, ctx.auth.userId)),
        })
        if (!group) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Character group not found',
          })
        }

        // Get user settings to check allowMultiConnectionsPerCharacter
        const userSettings = await tx.query.UserSettings.findFirst({
          where: eq(UserSettings.userId, ctx.auth.userId),
        })

        const allowMultiConnections =
          userSettings?.settings.persona.allowMultiConnectionsPerCharacter ?? false

        // Only delete existing links if multi-connections are not allowed
        if (!allowMultiConnections) {
          await tx
            .delete(PersonaToGroup)
            .where(
              and(
                eq(PersonaToGroup.groupId, input.groupId),
                eq(PersonaToGroup.userId, ctx.auth.userId),
              ),
            )
        }

        // Create new link
        const [link] = await tx
          .insert(PersonaToGroup)
          .values({
            personaId: input.personaId,
            groupId: input.groupId,
            userId: ctx.auth.userId,
          })
          .returning()

        if (!link) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to link persona to character group',
          })
        }

        return { link }
      })
    }),

  // Unlink persona from a character group
  unlinkFromGroup: userProtectedProcedure
    .input(
      z.object({
        personaId: z.string(),
        groupId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if persona exists and belongs to user
      const persona = await ctx.db.query.Persona.findFirst({
        where: and(eq(Persona.id, input.personaId), eq(Persona.userId, ctx.auth.userId)),
      })
      if (!persona) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Persona not found',
        })
      }

      // Check if group exists and belongs to user
      const group = await ctx.db.query.CharGroup.findFirst({
        where: and(eq(CharGroup.id, input.groupId), eq(CharGroup.userId, ctx.auth.userId)),
      })
      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Character group not found',
        })
      }

      const [link] = await ctx.db
        .delete(PersonaToGroup)
        .where(
          and(
            eq(PersonaToGroup.personaId, input.personaId),
            eq(PersonaToGroup.groupId, input.groupId),
            eq(PersonaToGroup.userId, ctx.auth.userId),
          ),
        )
        .returning()
      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Persona-group link not found',
        })
      }
      return { link }
    }),

  // Link persona to a chat
  linkToChat: userProtectedProcedure
    .input(
      z.object({
        personaId: z.string(),
        chatId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Check if persona exists and belongs to user
        const persona = await tx.query.Persona.findFirst({
          where: and(eq(Persona.id, input.personaId), eq(Persona.userId, ctx.auth.userId)),
        })
        if (!persona) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Persona not found',
          })
        }

        // Check if chat exists by querying the external service
        const ownx = createOwnxClient(ctx)
        const ownxTrpc = ownx.trpc
        await ownxTrpc.chat.byId.query({
          id: input.chatId,
        })

        // Delete existing links for the chat
        await tx
          .delete(PersonaToChat)
          .where(
            and(eq(PersonaToChat.chatId, input.chatId), eq(PersonaToChat.userId, ctx.auth.userId)),
          )

        // Create new link
        const [link] = await tx
          .insert(PersonaToChat)
          .values({
            personaId: input.personaId,
            chatId: input.chatId,
            userId: ctx.auth.userId,
          })
          .returning()

        if (!link) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to link persona to chat',
          })
        }

        return { link }
      })
    }),

  // Unlink persona from a chat
  unlinkFromChat: userProtectedProcedure
    .input(
      z.object({
        personaId: z.string(),
        chatId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if persona exists and belongs to user
      const persona = await ctx.db.query.Persona.findFirst({
        where: and(eq(Persona.id, input.personaId), eq(Persona.userId, ctx.auth.userId)),
      })
      if (!persona) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Persona not found',
        })
      }

      // Check if chat exists by querying the external service
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc
      await ownxTrpc.chat.byId.query({
        id: input.chatId,
      })

      const [link] = await ctx.db
        .delete(PersonaToChat)
        .where(
          and(
            eq(PersonaToChat.personaId, input.personaId),
            eq(PersonaToChat.chatId, input.chatId),
            eq(PersonaToChat.userId, ctx.auth.userId),
          ),
        )
        .returning()
      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Persona-chat link not found',
        })
      }
      return { link }
    }),
}
