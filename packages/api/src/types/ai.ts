import { z } from 'zod/v4'

import { sharedV2ProviderOptionsSchema } from '@cared/shared'

import type { LanguageModelV2Message } from '@ai-sdk/provider'

// Text part schema for message content
export const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
})

// File part schema for message content
export const filePartSchema = z.object({
  type: z.literal('file'),
  data: z.union([
    z.string(),
    z.url().transform((url) => new URL(url)),
    z.array(z.uint32().max(255)).transform((array) => Uint8Array.from(array)),
  ]),
  filename: z.string().optional(),
  mediaType: z.string(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
})

// Reasoning part schema for message content
export const reasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
})

// Tool call part schema for message content
export const toolCallPartSchema = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
  providerExecuted: z.boolean().optional(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
})

// Tool result content schema
export const toolResultContentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({ type: z.literal('json'), value: z.json() }),
  z.object({ type: z.literal('error-text'), value: z.string() }),
  z.object({ type: z.literal('error-json'), value: z.json() }),
  z.object({
    type: z.literal('content'),
    value: z.array(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('text'), text: z.string() }),
        z.object({
          type: z.literal('media'),
          data: z.string(),
          mediaType: z.string(),
        }),
      ]),
    ),
  }),
])

// Tool result part schema for message content
export const toolResultPartSchema = z.object({
  type: z.literal('tool-result'),
  toolCallId: z.string(),
  toolName: z.string(),
  output: toolResultContentSchema,
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
})

// Language model V2 message schema
export const languageModelV2MessageSchema = z
  .discriminatedUnion('role', [
    z.object({
      role: z.literal('system'),
      content: z.string(),
    }),
    z.object({
      role: z.literal('user'),
      content: z.array(z.discriminatedUnion('type', [textPartSchema, filePartSchema])),
    }),
    z.object({
      role: z.literal('assistant'),
      content: z.array(
        z.discriminatedUnion('type', [
          textPartSchema,
          filePartSchema,
          reasoningPartSchema,
          toolCallPartSchema,
          toolResultPartSchema,
        ]),
      ),
    }),
    z.object({
      role: z.literal('tool'),
      content: z.array(toolResultPartSchema),
    }),
  ])
  .and(
    z.object({
      providerOptions: sharedV2ProviderOptionsSchema.optional(),
    }),
  )

export const _: LanguageModelV2Message = {} as z.infer<typeof languageModelV2MessageSchema>
export const __: z.infer<typeof languageModelV2MessageSchema> = {} as LanguageModelV2Message

export const languageModelV2PromptSchema = z.array(languageModelV2MessageSchema)
