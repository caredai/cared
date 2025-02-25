import type { Message } from 'ai'
import { auth as authorize } from '@clerk/nextjs/server'

import { eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import {Chat, Message as DbMessage} from '@mindworld/db/schema'

import { generateChatTitleFromUserMessage } from './actions'
import { createCaller } from '..'
import {getModel} from '@mindworld/providers'

export async function POST(request: Request) {
  const { id, appId, appVersion, messages } = (await request.json()) as {
    id?: string
    appId?: string
    appVersion?: number | 'latest' | 'draft'
    messages: Message[]
  }

  const auth = await authorize()
  if (!auth.userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Only allow the last message to be from the user
  const userMessage = messages.at(-1)
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
    chat = await db.query.Chat.findFirst({
      where: eq(Chat.id, id),
    })
  }
  if (!chat) {
    if (!appId) {
      return new Response('Missing app id', { status: 400})
    }

    const caller = createCaller({
      auth,
      db
    })

    const { chat: chat_ } = await caller.chat.create({
      appId,
      appVersion,
      userId: auth.userId,
      metadata: {
        title: '',
        visibility: 'private',
      }
    })
    chat = chat_

    const {version: app} = await caller.app.getVersion({
      id: chat.appId,
      version: chat.appVersion,
    })

    // TODO: use the main agent in the app
    const languageModel = getModel(app.metadata.languageModel, 'language')
    if (!languageModel) {
      throw new Error(`Invalid language model configuration for app ${app.appId}/${app.version}`)
    }

    const title = await generateChatTitleFromUserMessage({ message: userMessage, model: languageModel })

    await caller.chat.update({
      id: chat.id,
      metadata: {
        title
      }
    })
  }
}
