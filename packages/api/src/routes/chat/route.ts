import assert from 'assert'
import { appendResponseMessages, createDataStreamResponse, smoothStream, streamText } from 'ai'
import hash from 'stable-hash'

import type { Agent, App, Chat, Message } from '@ownxai/db/schema'
import type { UIMessage } from '@ownxai/shared'
import { db } from '@ownxai/db/client'
import { generateMessageId } from '@ownxai/db/schema'
import { log } from '@ownxai/log'
import { getModel } from '@ownxai/providers/providers'
import { uiMessageSchema } from '@ownxai/shared'
import { buildTools, knowledgeTools, memoryTools } from '@ownxai/tools'

import { createCaller } from '../..'
import { auth } from '../../auth'
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
 *   - parentMessageId?: string - Optional parent message ID
 *   - retainBranch?: boolean - Whether retain message branch
 *   - preview?: boolean - Preview mode flag
 * @returns Streaming response with LLM generated content
 */
export async function POST(request: Request): Promise<Response> {
  const {
    id,
    agentId,
    messages: inputMessages,
    parentMessageId,
    retainBranch,
    preview,
  } = (await request.json()) as {
    id?: string
    agentId?: string
    messages: UIMessage[]
    parentMessageId?: string
    retainBranch?: boolean
    preview?: boolean
  }

  let inputMessage = inputMessages.at(-1)
  if (!inputMessage) {
    return new Response('No input message provided', { status: 400 })
  }

  inputMessage = uiMessageSchema.parse(inputMessage)

  const { appId, userId } = await auth()
  if (!appId || !userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const caller = createCaller({
    auth: {
      appId,
      userId,
    },
    db,
    headers: new Headers(),
  })

  let chat: Chat | undefined
  let deleteChat: (() => Promise<void>) | undefined
  if (id) {
    chat = (await caller.chat.byId({ id })).chat

    if (preview && !chat.debug) {
      return new Response('Chat is not in preview mode', { status: 400 })
    } else if (!preview && chat.debug) {
      return new Response('Chat is in preview mode', { status: 400 })
    }
  } else {
    // if no chat found, create a new one
    chat = (
      await caller.chat.create({
        id, // if id is provided, it will be used; otherwise, a new id will be generated
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

  // const revokable = false // TODO

  let lastMessage = (
    await caller.message.find({
      id: inputMessage.id,
    })
  ).message

  if (lastMessage) {
    if (parentMessageId && lastMessage.parentId !== parentMessageId) {
      await deleteChat?.()
      return new Response('Invalid parent message id', { status: 400 })
    }

    if (!retainBranch) {
      await caller.message.deleteTrailing({
        messageId: inputMessage.id,
      })
    }
  } else {
    if (!retainBranch && parentMessageId) {
      await caller.message.deleteTrailing({
        messageId: parentMessageId,
      })
    }

    lastMessage = (
      await caller.message.create({
        id: inputMessage.id,
        parentId: parentMessageId, // will be checked there
        chatId: chat.id,
        role: inputMessage.role,
        content: inputMessage,
      })
    ).message
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

  if (!chat.metadata.title) {
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

  const messages = await getMessages(caller, chat, agent, app, agents, lastMessage)

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
          const lastMessage = messages.at(-1)!
          const responseMessages = appendResponseMessages({
            // `appendResponseMessages` only use the last message in the input messages
            messages: [lastMessage],
            responseMessages: response.messages,
          })

          const newLastMessage = responseMessages.at(0)!
          assert(newLastMessage.id === lastMessage.id)

          if (hash(newLastMessage) !== hash(lastMessage)) {
            assert(responseMessages.length === 1)
            await caller.message.update({
              id: newLastMessage.id,
              content: newLastMessage as UIMessage,
            })
          } else {
            assert(responseMessages.length === 2)
            const msg = responseMessages.at(-1)!
            await caller.message.create({
              id: msg.id,
              parentId: lastMessage.id,
              chatId: chat.id,
              role: msg.role as any,
              agentId: agent.id,
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

async function getMessages(
  caller: ReturnType<typeof createCaller>,
  chat: Chat,
  currentAgent: Agent,
  app: App,
  agents_: Agent[],
  lastMsg: Message,
): Promise<UIMessage[]> {
  const allMesssages = (
    await caller.message.list({
      chatId: chat.id,
      before: lastMsg.id,
      limit: 10000, // TODO: truncate
    })
  ).messages

  const messageBranch = buildMessageBranchFromDescendant(allMesssages, lastMsg)

  const messages = messageBranch.map((msg) => {
    return {
      id: msg.id,
      role: msg.role,
      ...msg.content,
    }
  })

  if (app.type === 'single-agent') {
    return messages
  } else {
    const agents = new Map(agents_.map((agent) => [agent.id, agent]))

    return messages.map((msg, i) => {
      // Add agent name prefix for messages from other agents in multi-agent chat
      const agentId = allMesssages[i]?.agentId
      const agent = agentId ? agents.get(agentId) : undefined
      if (
        msg.role === 'assistant' &&
        agent &&
        // Skip adding prefix if agent is the current agent for chat
        agent.id !== currentAgent.id
      ) {
        const prefix = agent.name ? `${agent.name}: ` : ''

        // For string content, directly prepend prefix
        if (msg.content) {
          msg.content = prefix + msg.content
        }
        // For structured parts, add prefix to first text part
        else {
          // Locate the first text part
          const firstTextPart = msg.parts.find((item) => item.type === 'text')
          // Prepend prefix if text part exists
          if (firstTextPart) {
            firstTextPart.text = prefix + firstTextPart.text
          }
        }
      }

      return msg
    })
  }
}

function buildMessageBranchFromDescendant(messages: Message[], descendant: Message): Message[] {
  // Create a map for quick lookup of messages by their ID.
  const messageMap = new Map<string, Message>(messages.map((msg) => [msg.id, msg]))

  // Initialize the branch array with the descendant message.
  const branch: Message[] = []
  let currentMessage: Message | undefined = descendant

  // Traverse up the message tree using parentId until the root is reached,
  // or a message is not found in the map.
  while (currentMessage) {
    branch.push(currentMessage) // Add the current message to the beginning of the array.
    const parentId = currentMessage.parentId
    if (!parentId) {
      break // Reached the root of the branch.
    }
    currentMessage = messageMap.get(parentId) // Get the parent message from the map.
  }

  return branch.reverse()
}
