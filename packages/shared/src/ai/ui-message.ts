import type { UIMessage } from 'ai'
import { z } from 'zod/v4'

import { jsonValueSchema } from './json-value'

export type { UIMessage } from 'ai'

export type MessageContent = Pick<UIMessage, 'parts' | 'metadata'>

export const providerMetadataSchema = z.record(z.string(), z.record(z.string(), jsonValueSchema))

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
  providerMetadata: providerMetadataSchema.optional(),
})

// Source URL part schema
const sourceUrlUIPartSchema = z.object({
  type: z.literal('source-url'),
  sourceId: z.string(),
  url: z.string(),
  title: z.string().optional(),
  providerMetadata: providerMetadataSchema.optional(),
})

// Source document part schema
const sourceDocumentUIPartSchema = z.object({
  type: z.literal('source-document'),
  sourceId: z.string(),
  mediaType: z.string(),
  title: z.string(),
  filename: z.string().optional(),
  providerMetadata: providerMetadataSchema.optional(),
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

// Data part schema
const dataUIPartSchema = z.object({
  type: z.templateLiteral(['data-', z.string()]),
  id: z.string().optional(),
  data: z.any(),
})

// Tool part schema
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

// Dynamic Tool part schema
const dynamicToolUIPartSchema = z
  .object({
    type: z.literal('dynamic-tool'),
    toolName: z.string(),
    toolCallId: z.string(),
  })
  .and(
    z.discriminatedUnion('state', [
      z.object({
        state: z.literal('input-streaming'),
        input: z.unknown().or(z.undefined()),
      }),
      z.object({
        state: z.literal('input-available'),
        input: z.unknown(),
        callProviderMetadata: providerMetadataSchema.optional(),
      }),
      z.object({
        state: z.literal('output-available'),
        input: z.unknown(),
        output: z.unknown(),
        callProviderMetadata: providerMetadataSchema.optional(),
      }),
      z.object({
        state: z.literal('output-error'),
        input: z.unknown(),
        errorText: z.string(),
        callProviderMetadata: providerMetadataSchema.optional(),
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
  dynamicToolUIPartSchema,
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

// The following type assertions are used to ensure that the type and the zod schema inference are compatible.
// This helps to catch type mismatches between the schema and the type definition at compile time.
const _: UIMessage = {} as z.infer<typeof uiMessageSchema>
const __: z.infer<typeof uiMessageSchema> = {} as UIMessage
