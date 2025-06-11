import { Character, CharacterChat, CharGroup, CharGroupChat } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, inArray, lt } from 'drizzle-orm'
import { z } from 'zod'

import { createOwnxClient } from '../ownx'
import { userProtectedProcedure } from '../trpc'

export const chatRouter = {
  list: userProtectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { chats, hasMore, last } = await ownxTrpc.chat.list.query({
        before: input.cursor,
        limit: input.limit,
        orderBy: 'desc',
        orderOn: 'updatedAt',
      })

      // Get all chat IDs
      const chatIds = chats.map((chat) => chat.id)

      // Query character chat records for these chat IDs
      const characterChats = await ctx.db
        .select({
          chatId: CharacterChat.chatId,
          characterId: CharacterChat.characterId,
        })
        .from(CharacterChat)
        .where(inArray(CharacterChat.chatId, chatIds))

      // Query group chat records for these chat IDs
      const groupChats = await ctx.db
        .select({
          chatId: CharGroupChat.chatId,
          groupId: CharGroupChat.groupId,
        })
        .from(CharGroupChat)
        .where(inArray(CharGroupChat.chatId, chatIds))

      // Create a mapping table: chat ID -> character ID or group ID
      const chatToCharacterMap = Object.fromEntries(
        characterChats.map((record) => [record.chatId, record.characterId]),
      )
      const chatToGroupMap = Object.fromEntries(
        groupChats.map((record) => [record.chatId, record.groupId]),
      )

      return {
        chats: chats.map((chat) => {
          const { id, metadata, createdAt, updatedAt, lastMessage } = chat
          return {
            id,
            metadata,
            createdAt,
            updatedAt,
            lastMessage,
            characterId: chatToCharacterMap[id],
            groupId: chatToGroupMap[id],
          }
        }),
        hasMore,
        cursor: last,
      }
    }),

  listByCharacter: userProtectedProcedure
    .input(
      z.object({
        characterId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First get chat IDs and timestamps from character chat table
      const characterChats = await ctx.db
        .select({ id: CharacterChat.chatId, updatedAt: CharacterChat.updatedAt })
        .from(CharacterChat)
        .where(
          and(
            eq(CharacterChat.characterId, input.characterId),
            eq(CharacterChat.userId, ctx.auth.userId),
            typeof input.cursor === 'string'
              ? lt(CharacterChat.updatedAt, z.coerce.date().parse(input.cursor))
              : undefined,
          ),
        )
        .orderBy(desc(CharacterChat.updatedAt))
        .limit(input.limit + 1)

      const hasMore = characterChats.length > input.limit
      if (hasMore) {
        characterChats.pop()
      }

      const cursor = characterChats[characterChats.length - 1]?.updatedAt.toISOString()

      // Get chat IDs for querying ownx service
      const chatIds = characterChats.map((chat) => chat.id)

      // Fetch complete chat information from ownx service
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { chats } = await ownxTrpc.chat.listByIds.query({
        ids: chatIds,
      })

      // Create a map of chat ID to chat data for easy lookup
      const chatMap = Object.fromEntries(chats.map((chat) => [chat.id, chat]))

      return {
        chats: characterChats.map((chat) => {
          const ownxChat = chatMap[chat.id]
          if (!ownxChat) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Chat data inconsistency between ownx and local database',
            })
          }
          const { id, metadata, createdAt, updatedAt, lastMessage } = ownxChat
          return {
            id,
            metadata,
            createdAt,
            updatedAt,
            lastMessage,
            characterId: input.characterId,
          }
        }),
        hasMore,
        cursor,
      }
    }),

  listByGroup: userProtectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First get chat IDs and timestamps from group chat table
      const groupChats = await ctx.db
        .select({ id: CharGroupChat.chatId, updatedAt: CharGroupChat.updatedAt })
        .from(CharGroupChat)
        .where(
          and(
            eq(CharGroupChat.groupId, input.groupId),
            eq(CharGroupChat.userId, ctx.auth.userId),
            typeof input.cursor === 'string'
              ? lt(CharGroupChat.updatedAt, z.coerce.date().parse(input.cursor))
              : undefined,
          ),
        )
        .orderBy(desc(CharGroupChat.updatedAt))
        .limit(input.limit + 1)

      const hasMore = groupChats.length > input.limit
      if (hasMore) {
        groupChats.pop()
      }

      const cursor = groupChats[groupChats.length - 1]?.updatedAt.toISOString()

      // Get chat IDs for querying ownx service
      const chatIds = groupChats.map((chat) => chat.id)

      // Fetch complete chat information from ownx service
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { chats } = await ownxTrpc.chat.listByIds.query({
        ids: chatIds,
      })

      // Create a map of chat ID to chat data for easy lookup
      const chatMap = Object.fromEntries(chats.map((chat) => [chat.id, chat]))

      return {
        chats: groupChats.map((chat) => {
          const ownxChat = chatMap[chat.id]
          if (!ownxChat) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Chat data inconsistency between ownx and local database',
            })
          }
          const { id, metadata, createdAt, updatedAt, lastMessage } = ownxChat
          return {
            id,
            metadata,
            createdAt,
            updatedAt,
            lastMessage,
            groupId: input.groupId,
          }
        }),
        hasMore,
        cursor,
      }
    }),

  get: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const chat = (
        await ownxTrpc.chat.byId.query({
          id: input.id,
        })
      ).chat

      const characterChat = await ctx.db.query.CharacterChat.findFirst({
        columns: {
          characterId: true,
        },
        where: eq(CharacterChat.chatId, input.id),
      })

      const groupChat = await ctx.db.query.CharGroupChat.findFirst({
        columns: {
          groupId: true,
        },
        where: eq(CharGroupChat.chatId, input.id),
      })

      const { id, metadata, createdAt, updatedAt } = chat
      return {
        id,
        metadata,
        createdAt,
        updatedAt,
        characterId: characterChat?.characterId,
        groupId: groupChat?.groupId,
      }
    }),

  createForCharacter: userProtectedProcedure
    .input(
      z.object({
        characterId: z.string(),
        id: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

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

      const chat = (
        await ownxTrpc.chat.create.mutate({
          // If id is provided, it will be used; otherwise, a new id will be generated
          id: input.id,
          metadata: {
            title: '',
          },
        })
      ).chat

      await ctx.db.insert(CharacterChat).values({
        characterId: input.characterId,
        chatId: chat.id,
        userId: ctx.auth.userId,
      })

      const { id, metadata, createdAt, updatedAt } = chat
      return {
        id,
        metadata,
        createdAt,
        updatedAt,
        characterId: character.id,
      }
    }),

  createForGroup: userProtectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        id: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

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

      const chat = (
        await ownxTrpc.chat.create.mutate({
          // If id is provided, it will be used; otherwise, a new id will be generated
          id: input.id,
          metadata: {
            title: '',
          },
        })
      ).chat

      await ctx.db.insert(CharGroupChat).values({
        groupId: input.groupId,
        chatId: chat.id,
        userId: ctx.auth.userId,
      })

      const { id, metadata, createdAt, updatedAt } = chat
      return {
        id,
        metadata,
        createdAt,
        updatedAt,
        groupId: group.id,
      }
    }),

  update: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      // Update field `updatedAt`
      const chat = (
        await ownxTrpc.chat.update.mutate({
          id: input.id,
        })
      ).chat

      await ctx.db
        .update(CharacterChat)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(CharacterChat.chatId, input.id))
      await ctx.db
        .update(CharGroupChat)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(CharGroupChat.chatId, input.id))

      const { id, metadata, createdAt, updatedAt } = chat
      return {
        id,
        metadata,
        createdAt,
        updatedAt,
      }
    }),

  delete: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      await ctx.db.transaction(async (tx) => {
        await tx.delete(CharacterChat).where(eq(CharacterChat.chatId, input.id))

        await tx.delete(CharGroupChat).where(eq(CharGroupChat.chatId, input.id))

        await ownxTrpc.chat.delete.mutate({
          id: input.id,
        })
      })
    }),
}
