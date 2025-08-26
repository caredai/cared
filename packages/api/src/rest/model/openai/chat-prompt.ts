import type {
  LanguageModelV2Message,
  LanguageModelV2TextPart,
  LanguageModelV2ToolCallPart,
} from '@ai-sdk/provider'
import mime from 'mime'
import { z } from 'zod/v4'

export const ChatCompletionContentPartTextSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
})

const ChatCompletionContentPartImageSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.string(), // Either a URL of the image or the base64 encoded image data.
    detail: z.string().optional(),
  }),
})

const ChatCompletionContentPartInputAudioSchema = z.object({
  type: z.literal('input_audio'),
  input_audio: z.object({
    data: z.string(), // Base64 encoded audio data.
    format: z.enum(['wav', 'mp3']),
  }),
})

const ChatCompletionContentPartFileSchema = z.object({
  type: z.literal('file'),
  file: z.object({
    filename: z.string(),
    file_data: z.string(), // The base64 encoded file data.
  }),
})

const ChatCompletionContentPartSchema = z.discriminatedUnion('type', [
  ChatCompletionContentPartTextSchema,
  ChatCompletionContentPartImageSchema,
  ChatCompletionContentPartInputAudioSchema,
  ChatCompletionContentPartFileSchema,
])

const ChatCompletionSystemMessageSchema = z.object({
  role: z.literal('system'),
  content: z.union([z.string(), z.array(ChatCompletionContentPartTextSchema)]),
})

const ChatCompletionDeveloperMessageSchema = z.object({
  role: z.literal('developer'),
  content: z.union([z.string(), z.array(ChatCompletionContentPartTextSchema)]),
})

const ChatCompletionUserMessageSchema = z.object({
  role: z.literal('user'),
  content: z.union([z.string(), z.array(ChatCompletionContentPartSchema)]),
})

const ChatCompletionMessageToolCallSchema = z.object({
  type: z.literal('function'),
  id: z.string(),
  function: z.object({
    arguments: z.string(), // in JSON format
    name: z.string(),
  }),
})

const ChatCompletionAssistantMessageSchema = z.object({
  role: z.literal('assistant'),
  content: z
    .union([
      z.string(),
      z.array(
        z.discriminatedUnion('type', [
          ChatCompletionContentPartTextSchema,
        ]),
      ),
    ])
    .optional(),
  tool_calls: z.array(ChatCompletionMessageToolCallSchema).optional(),
})

const ChatCompletionToolMessageSchema = z.object({
  role: z.literal('tool'),
  content: z.union([z.string(), z.array(ChatCompletionContentPartTextSchema)]),
  tool_call_id: z.string(),
})

export const ChatCompletionMessageSchema = z.discriminatedUnion('role', [
  ChatCompletionSystemMessageSchema,
  ChatCompletionDeveloperMessageSchema,
  ChatCompletionUserMessageSchema,
  ChatCompletionAssistantMessageSchema,
  ChatCompletionToolMessageSchema,
])

export function convertToLanguageModelV2Messages(
  messages: z.infer<typeof ChatCompletionMessageSchema>[],
): LanguageModelV2Message[] {
  const langModelMessages: LanguageModelV2Message[] = []

  const toolNames = new Map<string, string>()

  for (const message of messages) {
    switch (message.role) {
      case 'system':
      case 'developer': {
        langModelMessages.push({
          role: 'system',
          content:
            typeof message.content === 'string'
              ? message.content
              : message.content.map((part) => part.type).join('\n'),
        })
        break
      }

      case 'user': {
        langModelMessages.push({
          role: 'user',
          content:
            typeof message.content === 'string'
              ? [{ type: 'text' as const, text: message.content }]
              : message.content.map((part) => {
                  switch (part.type) {
                    case 'text':
                      return { type: 'text' as const, text: part.text }
                    case 'image_url': {
                      let data
                      try {
                        data = new URL(part.image_url.url)
                      } catch {
                        data = part.image_url.url // base64 string
                      }
                      return {
                        type: 'file' as const,
                        mediaType:
                          (data instanceof URL && mime.getType(data.toString())) || 'image/*',
                        data,
                        ...(part.image_url.detail && {
                          providerOptions: {
                            // OpenAI specific extension: image detail
                            openai: {
                              imageDetail: part.image_url.detail,
                            },
                          },
                        }),
                      }
                    }
                    case 'input_audio':
                      return {
                        type: 'file' as const,
                        mediaType: part.input_audio.format === 'wav' ? 'audio/wav' : 'audio/mp3',
                        data: part.input_audio.data,
                      }
                    case 'file':
                      return {
                        type: 'file' as const,
                        mediaType:
                          (part.file.filename && mime.getType(part.file.filename)) ||
                          'application/pdf',
                        filename: part.file.filename,
                        data: part.file.file_data,
                      }
                  }
                }),
        })
        break
      }

      case 'assistant': {
        const parts: (LanguageModelV2TextPart | LanguageModelV2ToolCallPart)[] = []

        if (typeof message.content === 'string') {
          parts.push({ type: 'text', text: message.content })
        } else if (message.content) {
          for (const part of message.content) {
            parts.push({ type: 'text', text: part.text })
          }
        }

        for (const part of message.tool_calls ?? []) {
          parts.push({
            type: 'tool-call',
            toolCallId: part.id,
            toolName: part.function.name,
            input: JSON.parse(part.function.arguments),
          })

          toolNames.set(part.id, part.function.name)
        }

        langModelMessages.push({
          role: 'assistant',
          content: parts,
        })
        break
      }

      case 'tool': {
        langModelMessages.push({
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: message.tool_call_id,
              toolName: toolNames.get(message.tool_call_id) ?? '',
              output: {
                type: 'content',
                value:
                  typeof message.content === 'string'
                    ? [{ type: 'text', text: message.content }]
                    : message.content.map((part) => ({ type: 'text' as const, text: part.text })),
              },
            },
          ],
        })
        break
      }
    }
  }

  return langModelMessages
}
