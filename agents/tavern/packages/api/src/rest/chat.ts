import type { Message, UIMessage } from 'ai'
import { headers } from 'next/headers'
import { auth } from '@tavern/auth'
import { db } from '@tavern/db/client'

import type { Chat } from '@ownxai/sdk'

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
    messages: Message[]
    parentMessageId?: string
    retainBranch?: boolean
    modelId: string
  }

  const { session } =
    (await auth.api.getSession({
      headers: await headers(),
    })) ?? {}
  const userId = session?.userId
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

  let chat: Chat | undefined
  let deleteChat: (() => Promise<void>) | undefined
  if (id) {
    chat = (await ownxTrpc.chat.byId.query({ id })).chat
  } else {
    // if no chat found, create a new one
    chat = (
      await ownxTrpc.chat.create.mutate({
        id, // if id is provided, it will be used; otherwise, a new id will be generated
        metadata: {
          title: '',
        },
      })
    ).chat
  }
}
