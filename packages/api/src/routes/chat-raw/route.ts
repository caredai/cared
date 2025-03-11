import type { Message } from 'ai'
import { createDataStreamResponse, smoothStream, streamText } from 'ai'

import { generateMessageId } from '@mindworld/db/schema'
import { getModel } from '@mindworld/providers'
import { log } from '@mindworld/utils'

import { auth } from '@/auth'

export async function POST(request: Request) {
  const { messages, chatModel } = (await request.json()) as {
    messages: Message[]
    chatModel: string // model full id
  }

  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const model = getModel(chatModel, 'language')
  if (!model) {
    throw new Error(`Invalid chat model`)
  }

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model,
        messages,
        maxSteps: 5,
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateMessageId,
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
    onError: (error: any) => {
      log.error('AI SDK streamText error', error)
      return `Internal server error: ${error?.toString?.()}`
    },
  })
}
