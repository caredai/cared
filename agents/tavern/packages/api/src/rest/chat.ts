import type { LanguageModelV1 } from 'ai'
import { db } from '@tavern/db/client'
import { createDataStreamResponse, generateText, smoothStream, streamText } from 'ai'

import type { Chat, Message, OwnxTrpcClient, UIMessage } from '@ownxai/sdk'
import { log } from '@ownxai/log'
import {
  buildMessageBranchFromDescendant,
  generateMessageId,
  toUIMessages,
  uiMessageSchema,
} from '@ownxai/sdk'

import { auth } from '../auth'
import { createOwnxClient } from '../ownx'

export async function POST(request: Request): Promise<Response> {
  const {
    id,
    messages: inputMessages,
    parentMessageId,
    retainBranch,
    modelId,
  } = (await request.json()) as {
    id?: string
    messages: UIMessage[]
    parentMessageId?: string
    retainBranch?: boolean
    modelId: string
  }

  let inputMessage = inputMessages.at(-1)
  if (!inputMessage) {
    return new Response('No input message provided', { status: 400 })
  }
  inputMessage = uiMessageSchema.parse(inputMessage)

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

  let chat: Chat | undefined
  let deleteChat: (() => Promise<void>) | undefined
  if (id) {
    chat = (await ownxTrpc.chat.byId.query({ id })).chat
  } else {
    // if no chat found, create a new one
    const title = await generateChatTitleFromUserMessage({
      message: inputMessage,
      model: languageModel,
    })
    chat = (
      await ownxTrpc.chat.create.mutate({
        id, // if id is provided, it will be used; otherwise, a new id will be generated
        metadata: {
          title,
        },
      })
    ).chat

    deleteChat = async () => {
      await ownxTrpc.chat.delete.mutate({ id: chat!.id })
    }
  }

  let lastMessage = (
    await ownxTrpc.message.find.query({
      id: inputMessage.id,
    })
  ).message

  if (lastMessage) {
    if (parentMessageId && lastMessage.parentId !== parentMessageId) {
      await deleteChat?.()
      return new Response('Invalid parent message id', { status: 400 })
    }

    if (!retainBranch) {
      await ownxTrpc.message.delete.mutate({
        id: inputMessage.id,
        excludeSelf: true,
      })
    }
  } else {
    if (!retainBranch && parentMessageId) {
      await ownxTrpc.message.delete.mutate({
        id: parentMessageId,
        excludeSelf: true,
      })
    }

    lastMessage = (
      await ownxTrpc.message.create.mutate({
        id: inputMessage.id,
        parentId: parentMessageId,
        chatId: chat.id,
        role: inputMessage.role,
        content: inputMessage,
      })
    ).message
  }

  const messages = await getMessages(ownxTrpc, chat, lastMessage)

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: languageModel,
        system: '', // TODO
        messages: messages.map(msg => ({...msg, content: ''})),
        maxSteps: 1,
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateMessageId,
        onFinish: async ({ response: _response }) => {
          // TODO
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

async function getMessages(ownxTrpc: OwnxTrpcClient, chat: Chat, lastMsg: Message) {
  const allMessages = (
    await ownxTrpc.message.list.query({
      chatId: chat.id,
      before: lastMsg.id,
      limit: 10000, // TODO: truncate
    })
  ).messages

  const messageBranch = buildMessageBranchFromDescendant(allMessages, lastMsg)
  const messages = toUIMessages(messageBranch)
  // TODO
  return messages
}

async function generateChatTitleFromUserMessage({
  message,
  model,
}: {
  message: UIMessage
  model: LanguageModelV1
}) {
  const { text: title } = await generateText({
    model,
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - detect and use the same language as the user's message for the title
    - if user writes in Chinese, generate Chinese title; if in English, generate English title
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  })

  return title
}
