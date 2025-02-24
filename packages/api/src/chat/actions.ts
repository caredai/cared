import type { Message } from 'ai'
import { generateText } from 'ai'

import type { AppVersion } from '@mindworld/db/schema'
import { getModel } from '@mindworld/providers'

export async function generateChatTitleFromUserMessage({
  message,
  app,
}: {
  message: Message
  app: AppVersion
}) {
  // TODO: use the main agent in the app
  const languageModel = getModel(app.metadata.languageModel, 'language')
  if (!languageModel) {
    throw new Error(`Invalid language model configuration for app ${app.appId}/${app.version}`)
  }

  const { text: title } = await generateText({
    model: languageModel,
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
