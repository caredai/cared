import type { CharacterCardV1, CharacterCardV2, CharacterCardV3 } from '@tavern/core'
import type { CreateCharacterSchema } from '@tavern/db/schema'
import {
  characterCardV2Schema,
  convertToV2,
  importUrl,
  pngRead,
  pngWrite,
  updateWithV2,
} from '@tavern/core'
import { Character, characterSourceEnumValues } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, asc, eq, inArray } from 'drizzle-orm'
import hash from 'stable-hash'
import { z } from 'zod'

import { userProtectedProcedure } from '../trpc'
import { deleteImage, deleteImages, retrieveImage, uploadImage } from './utils'

async function getCharacterCard(url: string) {
  const bytes = await retrieveImage(url)

  const c = JSON.parse(pngRead(bytes))
  const cardV2 = convertToV2(c)

  return {
    card: c as CharacterCardV1 | CharacterCardV2 | CharacterCardV3,
    cardV2,
    bytes,
  }
}

async function processCharacterCard(dataUrlOrBytes: string | Uint8Array | Buffer, key?: string) {
  let buffer
  if (typeof dataUrlOrBytes === 'string') {
    // Convert data URL to buffer
    const base64Data = dataUrlOrBytes.replace(/^data:image\/\w+;base64,/, '')
    buffer = Buffer.from(base64Data, 'base64')
  } else {
    buffer = dataUrlOrBytes
  }

  const c = JSON.parse(pngRead(buffer))
  const charV2 = convertToV2(c)
  if (!charV2.data.name) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Character card name is required',
    })
  }

  const imageUrl = await uploadImage(
    buffer,
    key
      ? key
      : {
          name: charV2.data.name,
          prefix: 'characters',
        },
  )

  return {
    content: charV2,
    url: imageUrl,
  }
}

export const characterRouter = {
  list: userProtectedProcedure.query(async ({ ctx }) => {
    const characters = await ctx.db
      .select()
      .from(Character)
      .where(eq(Character.userId, ctx.auth.userId))
      .orderBy(asc(Character.id))
    return { characters }
  }),

  get: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.query.Character.findFirst({
        where: and(eq(Character.id, input.id), eq(Character.userId, ctx.auth.userId)),
      })
      if (!character) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Character not found',
        })
      }
      return { character }
    }),

  create: userProtectedProcedure
    .input(
      z.object({
        source: z.enum(characterSourceEnumValues),
        dataUrl: z.string().optional(),
        fromUrl: z.string().optional(),
        nftId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const values = {
        userId: ctx.auth.userId,
        source: input.source,
      } as z.infer<typeof CreateCharacterSchema>

      switch (input.source) {
        case 'create': // passthrough
        case 'import-file': {
          if (!input.dataUrl) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: '`dataUrl` is required for `create` or `import-file` source',
            })
          }
          const { content, url } = await processCharacterCard(input.dataUrl)

          values.content = content
          values.metadata = {
            url,
          }
          break
        }
        case 'import-url': {
          if (!input.fromUrl) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'fromUrl is required for import-url source',
            })
          }

          let dataUrlOrBytes: string | Uint8Array | undefined = input.dataUrl
          if (!dataUrlOrBytes) {
            const result = await importUrl(input.fromUrl)
            if (typeof result === 'string') {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Failed to import character card from url: ${result}`,
              })
            }
            if (result.type !== 'character' || result.mimeType !== 'image/png') {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid character card',
              })
            }
            dataUrlOrBytes = result.bytes
          }

          const { content, url } = await processCharacterCard(dataUrlOrBytes)

          values.content = content
          values.metadata = {
            url,
            fromUrl: input.fromUrl,
          }
          break
        }
        case 'nft-owned':
          values.nftId = input.nftId
          // TODO: validate nft owner
          // TODO: get url from nft
          throw new TRPCError({
            code: 'NOT_IMPLEMENTED',
            message: 'nft-owned source not implemented',
          })
          break
        case 'nft-link':
          values.nftId = input.nftId
          // TODO: check nft owner
          // TODO: get url from nft
          throw new TRPCError({
            code: 'NOT_IMPLEMENTED',
            message: 'nft-link source not implemented',
          })
          break
      }

      const [character] = await ctx.db.insert(Character).values(values).returning()
      if (!character) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create character',
        })
      }

      return { character }
    }),

  update: userProtectedProcedure
    .input(
      z
        .object({
          id: z.string(),
          dataUrl: z.string().optional(),
          content: characterCardV2Schema.optional(),
        })
        .refine((data) => data.dataUrl ?? data.content, 'Either dataUrl or content is required'),
    )
    .mutation(async ({ ctx, input }) => {
      let character = await ctx.db.query.Character.findFirst({
        where: and(eq(Character.id, input.id), eq(Character.userId, ctx.auth.userId)),
      })
      if (!character) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Character not found',
        })
      }

      switch (character.source) {
        case 'nft-owned':
        case 'nft-link':
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot update character card which has nft-owned or nft-link source',
          })
      }

      let content: z.infer<typeof characterCardV2Schema>

      if (input.dataUrl) {
        // Extract key from existing URL for re-upload
        const key = decodeURIComponent(new URL(character.metadata.url).pathname.slice(1))

        // Process new character card data and re-upload
        const result = await processCharacterCard(input.dataUrl, key)
        content = result.content
        if (result.url !== character.metadata.url) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Character card url should not be changed',
          })
        }
      } else {
        // Update existing character card with new content
        content = convertToV2(updateWithV2(character.content, input.content!))
      }

      if (hash(content) !== hash(character.content)) {
        character = (
          await ctx.db
            .update(Character)
            .set({
              content,
            })
            .where(eq(Character.id, input.id))
            .returning()
        ).at(0)!
      }

      return { character }
    }),

  sync: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.query.Character.findFirst({
        where: and(eq(Character.id, input.id), eq(Character.userId, ctx.auth.userId)),
      })
      if (!character) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Character not found',
        })
      }

      // Check if character source allows syncing
      switch (character.source) {
        case 'nft-owned':
        case 'nft-link':
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot sync character card which has nft-owned or nft-link source',
          })
      }

      // Get character card data from image
      const { card, cardV2, bytes } = await getCharacterCard(character.metadata.url)

      if (hash(character.content) === hash(cardV2)) {
        // Content is already in sync, no update needed
        return { character, synced: false }
      }

      // Content is out of sync, update image with database content
      const updatedContent = convertToV2(updateWithV2(card, character.content))
      const updatedBytes = pngWrite(bytes, JSON.stringify(updatedContent))

      // Extract key from existing URL for re-upload
      const key = decodeURIComponent(new URL(character.metadata.url).pathname.slice(1))

      // Upload updated image using the same key
      await uploadImage(updatedBytes, key)

      return { character, synced: true }
    }),

  delete: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [character] = await ctx.db
        .delete(Character)
        .where(and(eq(Character.id, input.id), eq(Character.userId, ctx.auth.userId)))
        .returning()
      if (!character) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Character not found',
        })
      }

      await deleteImage(character.metadata.url)

      return { character }
    }),

  batchDelete: userProtectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get all characters that belong to the user and match the provided IDs
      const characters = await ctx.db
        .select()
        .from(Character)
        .where(and(eq(Character.userId, ctx.auth.userId), inArray(Character.id, input.ids)))
      if (characters.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No characters found',
        })
      }

      // Delete all characters from the database
      await ctx.db
        .delete(Character)
        .where(and(eq(Character.userId, ctx.auth.userId), inArray(Character.id, input.ids)))

      // Delete all character cards from storage
      await deleteImages(characters.map((character) => character.metadata.url))

      return { characters }
    }),
}
