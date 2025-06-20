import assert from 'assert'
import type { MessageAnnotation } from '@tavern/core'
import { db } from '@tavern/db/client'
import { appendResponseMessages, createDataStreamResponse, smoothStream, streamText } from 'ai'
import hash from 'stable-hash'
import { z } from 'zod'

import type { UIMessage } from '@ownxai/sdk'
import { log } from '@ownxai/log'
import { generateMessageId, uiMessageSchema } from '@ownxai/sdk'

import { auth } from '../auth'
import { createOwnxClient } from '../ownx'

const requestBodySchema = z.object({
  id: z.string(),
  messages: z.array(uiMessageSchema).min(1),
  characterId: z.string(),
  modelId: z.string(),
  preferredLanguage: z.enum(['chinese', 'japanese']).optional(),
})

export async function POST(request: Request): Promise<Response> {
  let requestBody: z.infer<typeof requestBodySchema>

  try {
    const json = await request.json()
    requestBody = requestBodySchema.parse(json)
  } catch {
    return new Response('Invalid request', { status: 400 })
  }

  const { id, messages, characterId, modelId, preferredLanguage } = requestBody

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

  const annotation: MessageAnnotation = {
    characterId,
    modelId,
  }

  const skip = true

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: languageModel,
        messages: messages.map((msg) => ({ ...msg, content: '' })),
        maxSteps: 1,
        experimental_transform: smoothStream({
          chunking:
            preferredLanguage === 'chinese'
              ? /[\u4E00-\u9FFF]|\S+\s+/
              : preferredLanguage === 'japanese'
                ? /[\u3040-\u309F\u30A0-\u30FF]|\S+\s+/
                : 'word',
        }),
        experimental_generateMessageId: generateMessageId,
        onChunk() {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (skip) return
          dataStream.writeMessageAnnotation(annotation as any)
        },
        onFinish: async ({ response }) => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (skip) return

          const lastMessage = messages.at(-1)!
          const responseMessages = appendResponseMessages({
            // `appendResponseMessages` only use the last message in the input messages
            messages: [{ ...lastMessage, content: '' }],
            responseMessages: response.messages,
          })

          const newLastMessage = responseMessages.at(0)!
          assert(newLastMessage.id === lastMessage.id)

          if (hash(newLastMessage) !== hash(lastMessage)) {
            assert(responseMessages.length === 1 && newLastMessage.role === 'assistant')
            newLastMessage.annotations = [annotation as any]
            await ownxTrpc.message.update.mutate({
              id: newLastMessage.id,
              content: newLastMessage as UIMessage,
            })
          } else {
            assert(responseMessages.length === 2)
            const msg = responseMessages.at(-1)!
            assert(msg.role === 'assistant')
            msg.annotations = [annotation as any]
            await ownxTrpc.message.create.mutate({
              id: msg.id,
              parentId: lastMessage.id,
              chatId: chat.id,
              role: msg.role as any,
              content: msg as UIMessage,
            })
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      })

      void result.consumeStream()

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
        sendSources: true,
      })
    },
    onError: (error) => {
      log.error('AI SDK streamText error', error)
      return `Internal server error`
    },
  })
}
