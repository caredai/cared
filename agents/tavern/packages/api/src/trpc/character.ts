import * as path from 'path'
import type { CreateCharacterSchema } from '@tavern/db/schema'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { importUrl } from '@tavern/core'
import { Character, characterSourceEnumValues } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import sanitize from 'sanitize-filename'
import { v7 as uuid } from 'uuid'
import { z } from 'zod'

import { env } from '../env'
import { s3Client } from '../s3'
import { userProtectedProcedure } from '../trpc'

async function uploadCharacterCard(blob: Blob | Uint8Array, filename: string) {
  const key = `characters/${uuid()}/${sanitize(filename)}`
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: blob,
    ContentType: 'image/png',
  })
  await s3Client.send(command)
  return path.posix.join(env.S3_BUCKET, key)
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
      } as z.infer<typeof CreateCharacterSchema>

      switch (input.source) {
        case 'create': // passthrough
        case 'import-file':
          if (!input.blob || !input.filename) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'blob and filename are required for import-file source',
            })
          }
          values.metadata = {
            filename: input.filename,
            url: await uploadCharacterCard(input.blob, input.filename),
          }
          break
        case 'import-url': {
          if (!input.fromUrl) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'fromUrl is required for import-url source',
            })
          }
          const result = await importUrl(input.fromUrl)
          if (!result) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Failed to import character card from url',
            })
          }
          if (result.type !== 'character' || result.mimeType !== 'image/png') {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid character card',
            })
          }
          values.metadata = {
            filename: result.filename,
            url: await uploadCharacterCard(result.bytes, result.filename),
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

      await uploadCharacterCard(input.blob, character.metadata.filename)

      return { character }

      /*
      const [updated] = await ctx.db
        .update(Character)
        .set({})
        .where(and(eq(Character.id, input.id), eq(Character.userId, ctx.auth.userId)))
        .returning()

      return { character: updated }
      */
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
      return { character }
    }),
}
