import type { LanguageModelV1 } from '@ai-sdk/provider'
import { generateText } from 'ai'
import type { UIMessage } from '@ownxai/shared'

export async function generateChatTitleFromUserMessage({
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
