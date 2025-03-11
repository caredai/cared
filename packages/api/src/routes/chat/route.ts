import assert from 'assert'
import type { CoreMessage, Message } from 'ai'
import { convertToCoreMessages, createDataStreamResponse, smoothStream, streamText } from 'ai'

import type { Agent, App, Chat, MessageContent } from '@mindworld/db/schema'
import { db } from '@mindworld/db/client'
import { generateMessageId } from '@mindworld/db/schema'
import { getModel } from '@mindworld/providers'
import { buildTools, knowledgeTools, memoryTools } from '@mindworld/tools'
import { log } from '@mindworld/utils'

import { auth } from '@/auth'
import { createCaller } from '../..'
import { generateChatTitleFromUserMessage } from './actions'

/**
 * POST handler for chat API endpoint.
 * Handles chat message processing and LLM response generation.
 *
 * Important notes for Vercel AI SDK usage:
 * 1. Chat and message IDs:
 *    - Must use generateChatId() and generateMessageId()
 *    - Other ID formats will fail validation
 *
 * 2. Input messages handling:
 *    - Only the last message in input messages array is processed
 *    - For last message being a user message:
 *      - If last historical message is not user message: combine historical messages + input user message
 *      - If last historical message is user message:
 *        - Error if message IDs conflict
 *        - If IDs match, use input message content instead, combine historical messages - last historical message + input user message
 *    - For last message being non-user or empty input:
 *      - If last historical message is user message or tool message (with tool results): use historical messages
 *      - Otherwise error
 *    - Previous messages in input array are ignored
 *
 * 3. Tool execution:
 *    - Currently only supports server-side tools
 *    - Client-side tools not supported yet
 *    - Future client tool support requirements:
 *      - Must track client as tool executor
 *      - No direct asset manipulation allowed
 *
 * @param request - HTTP request containing:
 *   - id?: string - Optional chat ID
 *   - appId?: string - Optional app ID
 *   - agentId?: string - Optional agent ID
 *   - messages: Message[] - Input messages array, only last message used
 *   - preview?: boolean - Preview mode flag
 * @returns Streaming response with LLM generated content
 */
export async function POST(request: Request) {
  const {
    id,
    appId,
    agentId,
    messages: inputMessages,
    preview,
  } = (await request.json()) as {
    id?: string
    appId?: string
    agentId?: string
    messages: Message[]
    preview?: boolean
  }

  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const caller = createCaller({
    auth: {
      userId,
    },
    db,
  })

  let chat: Chat | undefined
  let deleteChat: (() => Promise<void>) | undefined
  if (id) {
    chat = (await caller.chat.byId({ id })).chat

    // if chat found, check if user is authorized to access it

    if (chat.userId !== userId) {
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
        userId,
        debug: preview,
        metadata: {
          title: '',
          visibility: 'private',
        },
      })
    ).chat

    deleteChat = async () => {
      await caller.chat.delete({ id: chat!.id })
    }
  }

  const inputMessage = inputMessages.at(-1)
  const lastMessage = (
    await caller.chat.listMessages({
      chatId: chat.id,
      limit: 1,
    })
  ).messages.at(-1)
  if (inputMessage?.role === 'user') {
    if (lastMessage?.role === 'user') {
      if (lastMessage.id !== inputMessage.id) {
        return new Response('The last historical message is also another user message', {
          status: 400,
        })
      }
      // replace the last user message with the new user message
      await caller.chat.deleteTrailingMessages({
        messageId: lastMessage.id,
      })
    }

    // save the new user message
    await caller.chat.createMessage({
      id: inputMessage.id,
      chatId: chat.id,
      ...convertToCoreMessages([inputMessage]).at(0)!,
    })
  } else {
    if (lastMessage?.role !== 'user' && lastMessage?.role !== 'tool') {
      await deleteChat?.()
      return new Response(`The last historical message is neither user's nor tool's`, {
        status: 400,
      })
    }
  }

  const app = (await caller.app.byId({ id: chat.appId })).app

  const agents = (
    await caller.agent.listByApp({
      appId: app.id,
    })
  ).agents

  let agent: Agent | undefined
  if (agentId) {
    agent = agents.find((agent) => agent.id === agentId)
    if (!agent) {
      await deleteChat?.()
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

  if (!chat.metadata.title && inputMessage) {
    const title = preview
      ? 'Preview & debug' // no need to generate a title for debug chats
      : await generateChatTitleFromUserMessage({
          message: inputMessage,
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

  const messages = await getMessages(caller, chat, agent, app, agents)

  return createDataStreamResponse({
    execute: (dataStream) => {
      // TODO: tools selection should be controlled by app/agent configuration
      const tools = buildTools(
        {
          userId,
          appId: app.id,
          preview,
          agentId: agent.id,
          chatId: chat.id,
          app,
          agent,
          chat,
          dataStream,
        },
        {
          ...memoryTools,
          ...knowledgeTools,
        },
      )

      const result = streamText({
        model: languageModel,
        system:
          agent.metadata.languageModelSettings?.systemPrompt ??
          app.metadata.languageModelSettings?.systemPrompt,
        messages,
        maxSteps: 5, // TODO
        experimental_activeTools: undefined, // TODO
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
      limit: 100, // TODO: truncate
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
