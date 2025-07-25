import type { UIMessage } from 'ai'
import { z } from 'zod/v4'

export type { UIMessage } from 'ai'

export type MessageContent = Pick<UIMessage, 'parts' | 'metadata'>

// Text part schema
const textUIPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  state: z.union([z.literal('streaming'), z.literal('done')]).optional(),
})

// Reasoning part schema
const reasoningUIPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
  state: z.union([z.literal('streaming'), z.literal('done')]).optional(),
  providerMetadata: z.record(z.string(), z.any()).optional(),
})

// Source URL part schema
const sourceUrlUIPartSchema = z.object({
  type: z.literal('source-url'),
  sourceId: z.string(),
  url: z.string(),
  title: z.string().optional(),
  providerMetadata: z.record(z.string(), z.any()).optional(),
})

// Source document part schema
const sourceDocumentUIPartSchema = z.object({
  type: z.literal('source-document'),
  sourceId: z.string(),
  mediaType: z.string(),
  title: z.string(),
  filename: z.string().optional(),
  providerMetadata: z.record(z.string(), z.any()).optional(),
})

// File part schema
const fileUIPartSchema = z.object({
  type: z.literal('file'),
  mediaType: z.string(),
  filename: z.string().optional(),
  url: z.string(),
})

// Step start part schema
const stepStartUIPartSchema = z.object({
  type: z.literal('step-start'),
})

// Data part schema (generic for any data types)
const dataUIPartSchema = z.object({
  type: z.templateLiteral(['data-', z.string()]),
  id: z.string().optional(),
  data: z.any(),
})

// Tool part schema (generic for any tool types)
const toolUIPartSchema = z
  .object({
    type: z.templateLiteral(['tool-', z.string()]),
    toolCallId: z.string(),
  })
  .and(
    z.discriminatedUnion('state', [
      z.object({
        state: z.literal('input-streaming'),
        input: z.any(),
        providerExecuted: z.boolean().optional(),
      }),
      z.object({
        state: z.literal('input-available'),
        input: z.any(),
        providerExecuted: z.boolean().optional(),
      }),
      z.object({
        state: z.literal('output-available'),
        input: z.any(),
        output: z.any(),
        providerExecuted: z.boolean().optional(),
      }),
      z.object({
        state: z.literal('output-error'),
        input: z.any(),
        errorText: z.string(),
        providerExecuted: z.boolean().optional(),
      }),
    ]),
  )

// Union of all message part schemas
const uiMessagePartSchema = z.union([
  textUIPartSchema,
  reasoningUIPartSchema,
  sourceUrlUIPartSchema,
  sourceDocumentUIPartSchema,
  fileUIPartSchema,
  stepStartUIPartSchema,
  dataUIPartSchema,
  toolUIPartSchema,
])

export const messageContentSchema = z.object({
  parts: z.array(uiMessagePartSchema),
  metadata: z.any().optional(),
})

export const messageRoleEnumValues = ['system', 'user', 'assistant'] as const

export const uiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(messageRoleEnumValues),
  ...messageContentSchema.shape,
})
