import type { Message } from 'ai'
import { auth } from '@clerk/nextjs/server'

import { eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { Chat, Message as DbMessage } from '@mindworld/db/schema'

export async function POST(request: Request) {
  const { id, messages } = (await request.json()) as { id: string; messages: Message[] }

  const { userId } = await auth()
  if (!userId) {
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

  const chat = await db.query.Chat.findFirst({
    where: eq(Chat.id, id),
  })
  if (!chat) {
    // TODO: create chat
  }
}
