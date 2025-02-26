import assert from 'assert'
import type { CoreMessage, Message } from 'ai'
import { auth as authorize } from '@clerk/nextjs/server'
import { createDataStreamResponse, smoothStream, streamText } from 'ai'

import type { Agent, App, Chat, MessageContent } from '@mindworld/db/schema'
import { eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { Message as DbMessage, generateMessageId } from '@mindworld/db/schema'
import { getModel } from '@mindworld/providers'
import { buildTools, memoryTools } from '@mindworld/tools'
import { log } from '@mindworld/utils'

import { createCaller } from '..'
import { generateChatTitleFromUserMessage } from './actions'

export async function POST(request: Request) {
  const {
    id,
    appId,
    preview,
    agentId,
    messages: inputMessages,
  } = (await request.json()) as {
    id?: string
    appId?: string
    preview?: boolean
    agentId?: string
    messages: Message[]
  }

  const auth = await authorize()
  if (!auth.userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const ctx = {
    auth,
    db,
  }
  const caller = createCaller(ctx)

  // Only allow the last message to be from the user
  const userMessage = inputMessages.at(-1)
  if (userMessage?.role !== 'user') {
    return new Response('No user message found', { status: 400 })
  }

  if (
    await db.query.Message.findFirst({
      where: eq(DbMessage.id, userMessage.id),
    })
  ) {
    return new Response('User message already exists', { status: 400 })
  }

  let chat: Chat | undefined
  if (id) {
    chat = (await caller.chat.byId(id)).chat

    // if chat found, check if user is authorized to access it

    if (chat.userId !== auth.userId) {
      return new Response('Unauthorized', { status: 401 })
    }
    if (appId && chat.appId !== appId) {
      return new Response('Unauthorized', { status: 401 })
    }
    if (preview && !chat.debug) {
      return new Response('Chat is not in preview mode', { status: 400 })
    } else if (!preview && chat.debug) {
      return new Response('Chat is in preview mode', { status: 400 })
    }
  } else {
    // if no chat found, create a new one

    if (!appId) {
      return new Response('Missing app id', { status: 400 })
    }

    chat = (
      await caller.chat.create({
        id, // if id is provided, it will be used; otherwise, a new id will be generated
        appId,
        userId: auth.userId,
        debug: preview,
        metadata: {
          title: '',
          visibility: 'private',
        },
      })
    ).chat
  }

  const app = (await caller.app.byId(chat.appId)).app

  const agents = (
    await caller.agent.listByApp({
      appId: app.id,
    })
  ).agents

  let agent: Agent | undefined
  if (agentId) {
    agent = agents.find((agent) => agent.id === agentId)
    if (!agent) {
      return new Response('Unauthorized', { status: 401 })
    }
  } else {
    // if no agent id is provided, use the first agent of the app
    agent = agents.at(0)
    assert(agent, 'No agents found for app')
  }

  const languageModel = getModel(
    agent.metadata.languageModel ?? app.metadata.languageModel,
    'language',
  )
  if (!languageModel) {
    throw new Error(`Invalid language model configuration for app ${app.id}`)
  }

  if (!chat.metadata.title) {
    const title = preview
      ? 'Preview & debug' // no need to generate a title for debug chats
      : await generateChatTitleFromUserMessage({
          message: userMessage,
          model: languageModel,
        })

    chat = (
      await caller.chat.update({
        id: chat.id,
        metadata: {
          title,
        },
      })
    ).chat
  }

  const tools = buildTools(
    {
      userId: auth.userId,
      appId: app.id,
      preview,
      agentId: agent.id,
      chatId: chat.id,
    },
    {
      ...memoryTools,
    },
  )

  const messages = await getMessages(caller, chat, agent, app, agents)

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: languageModel,
        system:
          agent.metadata.languageModelSettings?.systemPrompt ??
          app.metadata.languageModelSettings?.systemPrompt,
        messages,
        maxSteps: 5, // TODO
        experimental_activeTools: [],
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateMessageId,
        tools,
        onFinish: async ({ response }) => {
          await caller.chat.createMessages(
            response.messages.map((msg) => ({
              ...msg,
              chatId: chat.id,
              agentId: agent.id,
            })),
          )
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

async function getMessages(
  caller: ReturnType<typeof createCaller>,
  chat: Chat,
  currentAgent: Agent,
  app: App,
  agents_: Agent[],
): Promise<CoreMessage[]> {
  const dbMesssages = (
    await caller.chat.listMessages({
      chatId: chat.id,
      limit: 100, // TODO
    })
  ).messages

  const messages = dbMesssages.map((msg) => {
    return {
      role: msg.role,
      content: msg.content as MessageContent,
    } as CoreMessage
  })

  if (app.type === 'single-agent') {
    return messages
  } else {
    const agents = new Map(agents_.map((agent) => [agent.id, agent]))

    return messages.map((msg, i) => {
      let content = msg.content

      // Add agent name prefix for messages from other agents in multi-agent chat
      const agentId = dbMesssages[i]?.agentId
      const agent = agentId ? agents.get(agentId) : undefined
      if (
        msg.role === 'assistant' &&
        agent &&
        // Skip adding prefix if agent is the current agent for chat
        agent.id !== currentAgent.id
      ) {
        const prefix = agent.name ? `${agent.name}: ` : ''

        const assistantContent = msg.content

        // For string content, directly prepend prefix
        if (typeof assistantContent === 'string') {
          content = prefix + assistantContent
        }
        // For structured content, add prefix to first text part
        else {
          // Clone to preserve original content
          const assistantContent_ = structuredClone(assistantContent)
          // Locate first text part
          const firstTextPart = assistantContent_.find((item) => item.type === 'text')
          // Prepend prefix if text part exists
          if (firstTextPart) {
            firstTextPart.text = prefix + firstTextPart.text
          }
          content = assistantContent_
        }
      }

      return {
        role: msg.role,
        content,
      } as CoreMessage
    })
  }
}
