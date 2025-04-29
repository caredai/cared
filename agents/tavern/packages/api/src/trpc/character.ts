import * as path from 'path'
import type { CharacterCardV2 } from '@risuai/ccardlib'
import type { CreateCharacterSchema } from '@tavern/db/schema'
import { DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { convertToV2, importUrl, pngRead } from '@tavern/core'
import { Character, characterSourceEnumValues } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, eq, inArray } from 'drizzle-orm'
import sanitize from 'sanitize-filename'
import hash from 'stable-hash'
import { v7 as uuid } from 'uuid'
import { z } from 'zod'

import { env } from '../env'
import { s3Client } from '../s3'
import { userProtectedProcedure } from '../trpc'

async function uploadCharacterCard(blob: Blob | Uint8Array, filename: string) {
  if (!env.NEXT_PUBLIC_IMAGE_URL) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Environment variable NEXT_PUBLIC_IMAGE_URL is not set',
    })
  }

  const bytes = blob instanceof Blob ? await blob.bytes() : blob
  const c = JSON.parse(pngRead(bytes))
  const charV2 = convertToV2(c)
  const key = `characters/${uuid()}/${sanitize(filename)}`
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: bytes,
    ContentType: 'image/png',
  })
  await s3Client.send(command)

  return {
    content: charV2,
    url: path.posix.join(env.NEXT_PUBLIC_IMAGE_URL, key),
  }
}

async function deleteCharacterCard(url: string) {
  if (!url.startsWith(env.S3_BUCKET)) {
    return
  }
  const key = new URL(url).pathname.slice(1) // Remove leading slash
  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })
  await s3Client.send(command)
}

async function deleteCharacterCards(urls: string[]) {
  // Filter out invalid URLs and extract keys
  const keys = urls
    .filter((url) => url.startsWith(env.S3_BUCKET))
    .map((url) => ({
      Key: new URL(url).pathname.slice(1), // Remove leading slash
    }))

  if (keys.length === 0) {
    return
  }

  // AWS S3 DeleteObjects has a limit of 1000 objects per request
  const chunkSize = 1000
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize)
    const command = new DeleteObjectsCommand({
      Bucket: env.S3_BUCKET,
      Delete: {
        Objects: chunk,
        Quiet: true, // Don't return detailed errors for each object
      },
    })
    await s3Client.send(command)
  }
}

export const characterRouter = {
  list: userProtectedProcedure.query(async ({ ctx }) => {
    const characters = await ctx.db
      .select()
      .from(Character)
      .where(eq(Character.userId, ctx.auth.userId))
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
      z
        .instanceof(FormData)
        .transform((fd) => Object.fromEntries(fd.entries()))
        .pipe(
          z.object({
            source: z.enum(characterSourceEnumValues),
            blob: z.instanceof(Blob).optional(),
            filename: z.string().optional(),
            fromUrl: z.string().optional(),
            nftId: z.string().optional(),
          }),
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const values = {
        userId: ctx.auth.userId,
        source: input.source,
      } as z.infer<typeof CreateCharacterSchema> & {
        content: CharacterCardV2
      }

      switch (input.source) {
        case 'create': // passthrough
        case 'import-file': {
          if (!input.blob || !input.filename) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'blob and filename are required for import-file source',
            })
          }
          const { content, url } = await uploadCharacterCard(input.blob, input.filename)

          values.content = content
          values.metadata = {
            filename: input.filename,
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

          let blob: Blob | Uint8Array | undefined = input.blob
          let filename = input.filename
          if (!blob || !filename) {
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

            blob = result.bytes
            filename = result.filename
          }

          const { content, url } = await uploadCharacterCard(blob, filename)

          values.content = content
          values.metadata = {
            filename,
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
        .instanceof(FormData)
        .transform((fd) => Object.fromEntries(fd.entries()))
        .pipe(
          z.object({
            id: z.string(),
            blob: z.instanceof(Blob),
          }),
        ),
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

      switch (character.source) {
        case 'nft-owned':
        case 'nft-link':
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot update character card which has nft-owned or nft-link source',
          })
      }

      const { content, url } = await uploadCharacterCard(input.blob, character.metadata.filename)

      if (hash(content) !== hash(character.content) || url !== character.metadata.url) {
        await ctx.db
          .update(Character)
          .set({
            content,
            metadata: {
              ...character.metadata,
              url,
            },
          })
          .where(eq(Character.id, input.id))
      }

      return { character }
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

      await deleteCharacterCard(character.metadata.url)

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

      // Delete all character cards from storage
      await deleteCharacterCards(characters.map((character) => character.metadata.url))

      // Delete all characters from database
      await ctx.db
        .delete(Character)
        .where(and(eq(Character.userId, ctx.auth.userId), inArray(Character.id, input.ids)))

      return { characters }
    }),
}
