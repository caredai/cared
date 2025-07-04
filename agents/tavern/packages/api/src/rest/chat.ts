import assert from 'assert'
import type { MessageMetadata } from '@tavern/core'
import { messageContentSchema } from '@tavern/core'
import { db } from '@tavern/db/client'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai'
import { z } from 'zod/v4'

import { log } from '@ownxai/log'
import { generateMessageId, uiMessageSchema } from '@ownxai/sdk'

import { auth } from '../auth'
import { createOwnxClient } from '../ownx'

const requestBodySchema = z.object({
  id: z.string(),
  messages: z.array(uiMessageSchema).min(1),
  lastMessage: z.object({
    id: z.string(),
    parentId: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    role: z.enum(['user', 'assistant']),
    content: messageContentSchema,
  }),
  characterId: z.string().min(1),
  modelId: z.string().min(1),
  preferredLanguage: z.enum(['chinese', 'japanese']).optional(),
})

export async function POST(request: Request): Promise<Response> {
  let requestBody: z.infer<typeof requestBodySchema>

  try {
    const json = await request.json()
    requestBody = requestBodySchema.parse(json)
  } catch {
    // console.log(error)
    return new Response('Invalid request', { status: 400 })
  }

  const { id, messages, lastMessage, characterId, modelId, preferredLanguage } = requestBody
  console.log('messages:', JSON.stringify(messages, undefined, 2))

  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const ctx = {
    auth: {
      userId,
    },
    db,
  }

  const ownx = createOwnxClient(ctx)
  const ownxTrpc = ownx.trpc

  const languageModel = await ownx.createLanguageModel(modelId)

  const chat = (await ownxTrpc.chat.byId.query({ id })).chat

  if (lastMessage.role === 'user') {
    await ownxTrpc.message.create.mutate({
      chatId: chat.id,
      ...lastMessage,
    })
  }

  const metadata: MessageMetadata = {
    characterId,
    modelId,
  }

  const stream = createUIMessageStream({
    execute: ({ writer: dataStream }) => {
      const result = streamText({
        model: languageModel,
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
        experimental_transform: smoothStream({
          chunking:
            preferredLanguage === 'chinese'
              ? /[\u4E00-\u9FFF]|\S+\s+/
              : preferredLanguage === 'japanese'
                ? /[\u3040-\u309F\u30A0-\u30FF]|\S+\s+/
                : 'word',
        }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      })

      void result.consumeStream()

      dataStream.merge(
        result.toUIMessageStream({
          messageMetadata: () => metadata,
          sendReasoning: true,
          sendSources: true,
          sendStart: true,
          sendFinish: true,
        }),
      )
    },
    generateId: generateMessageId,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onFinish: async ({ responseMessage, isContinuation }) => {
      assert.equal(responseMessage.role, 'assistant')
      if (isContinuation) {
        assert.equal(responseMessage.id, lastMessage.id)

        await ownxTrpc.message.update.mutate({
          id: responseMessage.id,
          content: responseMessage,
        })
      } else {
        await ownxTrpc.message.create.mutate({
          id: responseMessage.id,
          parentId: lastMessage.id,
          chatId: chat.id,
          role: responseMessage.role,
          content: responseMessage,
        })
      }
    },
    onError: (error) => {
      log.error('AI SDK streamText error', error)
      return `Internal server error`
    },
  })

  return createUIMessageStreamResponse({ stream })
}
