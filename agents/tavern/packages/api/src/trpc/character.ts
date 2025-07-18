import type {
  CharacterCardV1,
  CharacterCardV2,
  CharacterCardV3,
  LorebookEntry,
  LorebookV3,
  lorebookV3Schema,
} from '@tavern/core'
import type { CreateCharacterSchema } from '@tavern/db/schema'
import {
  characterCardV3Schema,
  convertToV3,
  importUrl,
  lorebookEntriesSchema,
  pngRead,
  pngWrite,
  Position,
  SelectiveLogic,
  updateWithV3,
} from '@tavern/core'
import {
  Character,
  CharacterChat,
  characterSourceEnumValues,
  Lorebook,
  LorebookToCharacter,
} from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, asc, eq, inArray } from 'drizzle-orm'
import sanitize from 'sanitize-filename'
import hash from 'stable-hash'
import { z } from 'zod/v4'

import { createOwnxClient } from '../ownx'
import { userProtectedProcedure } from '../trpc'
import { deleteImage, deleteImages, retrieveImage, uploadImage } from './utils'

async function getCharacterCard(url: string) {
  const bytes = await retrieveImage(url)

  const c = JSON.parse(pngRead(bytes))
  const cardV3 = convertToV3(c)

  return {
    card: c as CharacterCardV1 | CharacterCardV2 | CharacterCardV3,
    cardV3,
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
  const charV3 = convertToV3(c)
  if (!charV3.data.name) {
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
          name: charV3.data.name,
          prefix: 'characters',
        },
  )

  return {
    content: charV3,
    url: imageUrl,
  }
}

// Helper function to convert character book entries to lorebook entries
function convertCharacterBookToLorebookEntries(
  characterBook: z.infer<typeof lorebookV3Schema>,
): LorebookEntry[] {
  return characterBook.entries.map((entry, index) => {
    const extensions = entry.extensions

    let position = 0
    // Try to get position from extensions first, then from entry
    if (extensions.position !== undefined) {
      position = extensions.position
    } else {
      switch (entry.position) {
        case 'before_char':
          position = 0 // Position.Before
          break
        case 'after_char':
          position = 1 // Position.After
          break
        default:
          break
      }
    }

    let selectiveLogic = SelectiveLogic.AND_ANY
    if (extensions.selectiveLogic !== undefined) {
      switch (extensions.selectiveLogic) {
        case 0:
          selectiveLogic = SelectiveLogic.AND_ANY
          break
        case 1:
          selectiveLogic = SelectiveLogic.NOT_ALL
          break
        case 2:
          selectiveLogic = SelectiveLogic.NOT_ANY
          break
        case 3:
          selectiveLogic = SelectiveLogic.AND_ALL
          break
        default:
          break
      }
    }

    let role: 'system' | 'user' | 'assistant' | undefined = undefined
    if (extensions.role !== undefined) {
      switch (extensions.role) {
        case 0:
          role = 'system'
          break
        case 1:
          role = 'user'
          break
        case 2:
          role = 'assistant'
          break
        default:
          break
      }
    }

    return {
      uid: entry.id ?? index,
      disabled: !entry.enabled,
      keys: entry.keys,
      secondaryKeys: entry.secondary_keys ?? [],
      comment: entry.comment ?? '',
      content: entry.content,
      constant: entry.constant ?? false,
      vectorized: extensions.vectorized ?? false,
      selectiveLogic,
      order: entry.insertion_order,
      position,
      excludeRecursion: extensions.exclude_recursion ?? false,
      preventRecursion: extensions.prevent_recursion ?? false,
      delayUntilRecursion: extensions.delay_until_recursion ?? false,
      probability: extensions.probability ?? entry.priority ?? 100,
      depth: extensions.depth ?? undefined,
      group: extensions.group ?? '',
      groupOverride: extensions.group_override ?? false,
      groupWeight: extensions.group_weight ?? 100,
      sticky: extensions.sticky ?? 0,
      cooldown: extensions.cooldown ?? 0,
      delay: extensions.delay ?? 0,
      scanDepth: extensions.scan_depth ?? undefined,
      caseSensitive: extensions.case_sensitive ?? entry.case_sensitive,
      matchWholeWords: extensions.match_whole_words ?? false,
      useGroupScoring: extensions.use_group_scoring ?? false,
      automationId: extensions.automation_id ?? undefined,
      role,
      selective: entry.selective ?? false,
      useProbability: extensions.useProbability ?? false,
      addMemo: false, // Character book doesn't have this field
      characterFilter: undefined, // Character book doesn't have this field
      matchPersonaDescription: extensions.match_persona_description ?? undefined,
      matchCharacterDescription: extensions.match_character_description ?? undefined,
      matchCharacterPersonality: extensions.match_character_personality ?? undefined,
      matchCharacterDepthPrompt: extensions.match_character_depth_prompt ?? undefined,
      matchScenario: extensions.match_scenario ?? undefined,
      matchCreatorNotes: extensions.match_creator_notes ?? undefined,
    }
  })
}

function convertLorebookEntriesToCharacterBook(
  entries: LorebookEntry[],
  name?: string,
): LorebookV3 {
  return {
    name,
    entries: entries.map((entry, index) => {
      let position: 'before_char' | 'after_char' | undefined = undefined
      if (entry.position === Position.Before) {
        position = 'before_char'
      } else if (entry.position === Position.After) {
        position = 'after_char'
      }

      // Convert selective logic back to numeric format
      let selectiveLogic: number | undefined = undefined
      switch (entry.selectiveLogic) {
        case SelectiveLogic.AND_ANY:
          selectiveLogic = 0
          break
        case SelectiveLogic.NOT_ALL:
          selectiveLogic = 1
          break
        case SelectiveLogic.NOT_ANY:
          selectiveLogic = 2
          break
        case SelectiveLogic.AND_ALL:
          selectiveLogic = 3
          break
        default:
          break
      }

      // Convert role back to numeric format
      let role: number | undefined = undefined
      if (entry.role) {
        switch (entry.role) {
          case 'system':
            role = 0
            break
          case 'user':
            role = 1
            break
          case 'assistant':
            role = 2
            break
          default:
            break
        }
      }

      return {
        id: entry.uid,
        keys: entry.keys,
        secondary_keys: entry.secondaryKeys ?? [],
        comment: entry.comment,
        content: entry.content,
        constant: entry.constant,
        selective: entry.selective,
        insertion_order: entry.order,
        enabled: !entry.disabled,
        position,
        case_sensitive: entry.caseSensitive,
        use_regex: true, // Default value for character book
        extensions: {
          position: entry.position,
          exclude_recursion: entry.excludeRecursion,
          display_index: index, // sorting
          probability: entry.probability,
          useProbability: entry.useProbability,
          depth: entry.depth,
          selectiveLogic,
          group: entry.group,
          group_override: entry.groupOverride,
          group_weight: entry.groupWeight,
          prevent_recursion: entry.preventRecursion,
          delay_until_recursion: entry.delayUntilRecursion,
          scan_depth: entry.scanDepth,
          match_whole_words: entry.matchWholeWords,
          use_group_scoring: entry.useGroupScoring,
          case_sensitive: entry.caseSensitive,
          automation_id: entry.automationId,
          role,
          vectorized: entry.vectorized,
          sticky: entry.sticky,
          cooldown: entry.cooldown,
          delay: entry.delay,
          match_persona_description: entry.matchPersonaDescription,
          match_character_description: entry.matchCharacterDescription,
          match_character_personality: entry.matchCharacterPersonality,
          match_character_depth_prompt: entry.matchCharacterDepthPrompt,
          match_scenario: entry.matchScenario,
          match_creator_notes: entry.matchCreatorNotes,
        },
      }
    }),
    extensions: {},
  }
}

export const characterRouter = {
  list: userProtectedProcedure.query(async ({ ctx }) => {
    const characters = await ctx.db
      .select()
      .from(Character)
      .where(eq(Character.userId, ctx.auth.userId))
      .orderBy(asc(Character.id))
    return {
      characters: characters.map((character) => ({
        ...character,
        // TODO: remove this conversion when all characters are in V3 format
        content: convertToV3(character.content), // Ensure content is always in V3 format
      })),
    }
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

      return await ctx.db.transaction(async (tx) => {
        const [character] = await tx.insert(Character).values(values).returning()
        if (!character) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create character',
          })
        }

        // Check if character has embedded lorebook and create it
        const characterBook = character.content.data.character_book
        if (characterBook) {
          const entries = convertCharacterBookToLorebookEntries(characterBook)

          if (entries.length > 0) {
            const validatedEntries = lorebookEntriesSchema.parse(entries)

            const lorebookName = characterBook.name || `${character.content.data.name}'s Lorebook`

            const [lorebook] = await tx
              .insert(Lorebook)
              .values({
                userId: ctx.auth.userId,
                name: lorebookName,
                description: characterBook.description,
                entries: validatedEntries,
              })
              .returning()
            if (!lorebook) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to create lorebook',
              })
            }

            // If there is a primary character already linked, remove it
            await tx
              .delete(LorebookToCharacter)
              .where(
                and(
                  eq(LorebookToCharacter.characterId, character.id),
                  eq(LorebookToCharacter.userId, ctx.auth.userId),
                  eq(LorebookToCharacter.primary, true),
                ),
              )

            // Link the lorebook to the character as primary
            await tx.insert(LorebookToCharacter).values({
              lorebookId: lorebook.id,
              characterId: character.id,
              userId: ctx.auth.userId,
              primary: true,
            })
          }
        }

        return { character }
      })
    }),

  update: userProtectedProcedure
    .input(
      z
        .object({
          id: z.string(),
          dataUrl: z.string().optional(),
          content: characterCardV3Schema.optional(),
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

      let content: z.infer<typeof characterCardV3Schema>

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
        content = convertToV3(updateWithV3(character.content, input.content!))
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
      let character = await ctx.db.query.Character.findFirst({
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

      const primaryLorebookLink = await ctx.db.query.LorebookToCharacter.findFirst({
        where: and(
          eq(LorebookToCharacter.characterId, character.id),
          eq(LorebookToCharacter.primary, true),
        ),
        with: {
          lorebook: true,
        },
      })

      if (primaryLorebookLink?.lorebook) {
        const characterBook = convertLorebookEntriesToCharacterBook(
          primaryLorebookLink.lorebook.entries,
          primaryLorebookLink.lorebook.name,
        )
        if (hash(character.content.data.character_book) !== hash(characterBook)) {
          const updatedContent = {
            ...character.content,
            data: {
              ...character.content.data,
              character_book: characterBook,
            },
          }
          character = (
            await ctx.db
              .update(Character)
              .set({
                content: updatedContent,
              })
              .where(eq(Character.id, character.id))
              .returning()
          ).at(0)!
        }
      }

      const keySuffix = `/${sanitize(character.content.data.name)}.png`

      // Extract key from existing URL
      const key = decodeURIComponent(new URL(character.metadata.url).pathname.slice(1))

      const isUrlChanged = !key.endsWith(keySuffix)

      // Get character card data from image
      const { card, cardV3, bytes } = await getCharacterCard(character.metadata.url)

      if (hash(character.content) === hash(cardV3) && !isUrlChanged) {
        // Content is already in sync, no update needed
        return { character, synced: false }
      }

      // Content is out of sync, update image with database content
      const updatedContent = convertToV3(updateWithV3(card, character.content))

      const updatedBytes = pngWrite(bytes, JSON.stringify(updatedContent))

      // Upload updated image
      const imageUrl = await uploadImage(
        updatedBytes,
        !isUrlChanged
          ? key
          : {
              name: character.content.data.name,
              prefix: 'characters',
            },
      )

      if (isUrlChanged) {
        const oldImageUrl = character.metadata.url

        character = (
          await ctx.db
            .update(Character)
            .set({
              metadata: {
                ...character.metadata,
                url: imageUrl,
              },
            })
            .where(eq(Character.id, character.id))
            .returning()
        ).at(0)!

        await deleteImage(oldImageUrl)
      }

      return { character, synced: true }
    }),

  delete: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First, find all chats associated with this character
      const characterChats = await ctx.db
        .select({ chatId: CharacterChat.chatId })
        .from(CharacterChat)
        .where(
          and(eq(CharacterChat.characterId, input.id), eq(CharacterChat.userId, ctx.auth.userId)),
        )

      // Delete chats in batches of 100
      if (characterChats.length > 0) {
        const ownx = createOwnxClient(ctx)
        const ownxTrpc = ownx.trpc

        const chatIds = characterChats.map((cc) => cc.chatId)

        for (let i = 0; i < chatIds.length; i += 100) {
          await ownxTrpc.chat.batchDelete.mutate({
            ids: chatIds.slice(i, i + 100),
          })
        }
      }

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

      // First, find all chats associated with these characters
      const characterChats = await ctx.db
        .select({ chatId: CharacterChat.chatId })
        .from(CharacterChat)
        .where(
          and(
            inArray(CharacterChat.characterId, input.ids),
            eq(CharacterChat.userId, ctx.auth.userId),
          ),
        )

      // Delete chats in batches of 100
      if (characterChats.length > 0) {
        const ownx = createOwnxClient(ctx)
        const ownxTrpc = ownx.trpc

        const chatIds = characterChats.map((cc) => cc.chatId)

        for (let i = 0; i < chatIds.length; i += 100) {
          await ownxTrpc.chat.batchDelete.mutate({
            ids: chatIds.slice(i, i + 100),
          })
        }
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
