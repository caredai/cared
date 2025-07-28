import type { ToolCallPart, ToolResultPart } from 'ai'
import { z } from 'zod/v4'

export type { ModelMessage } from 'ai'

export const sharedV2ProviderOptionsSchema = z.record(z.string(), z.record(z.string(), z.json()))

export const providerOptionsSchema = sharedV2ProviderOptionsSchema

const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  providerOptions: providerOptionsSchema.optional(),
})

const imagePartSchema = z.object({
  type: z.literal('image'),
  image: z.union([
    z.string(),
    z.instanceof(Uint8Array),
    z.instanceof(ArrayBuffer),
    z.instanceof(Buffer),
    z.array(z.uint32().max(255)).transform((array) => Uint8Array.from(array)),
    z.url().transform((url) => new URL(url)),
  ]),
  mediaType: z.string().optional(),
  providerOptions: providerOptionsSchema.optional(),
})

const filePartSchema = z.object({
  type: z.literal('file'),
  data: z.union([
    z.string(),
    z.instanceof(Uint8Array),
    z.instanceof(ArrayBuffer),
    z.instanceof(Buffer),
    z.array(z.uint32().max(255)).transform((array) => Uint8Array.from(array)),
    z.url().transform((url) => new URL(url)),
  ]),
  filename: z.string().optional(),
  mediaType: z.string(),
  providerOptions: providerOptionsSchema.optional(),
})

const reasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
  providerOptions: providerOptionsSchema.optional(),
})

const toolCallPartSchema = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
  providerOptions: providerOptionsSchema.optional(),
  providerExecuted: z.boolean().optional(),
}) as z.ZodType<ToolCallPart>

const toolResultOutputSchema = z.union([
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({ type: z.literal('json'), value: z.json() }),
  z.object({ type: z.literal('error-text'), value: z.string() }),
  z.object({ type: z.literal('error-json'), value: z.json() }),
  z.object({
    type: z.literal('content'),
    value: z.array(
      z.union([
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

const toolResultPartSchema = z.object({
  type: z.literal('tool-result'),
  toolCallId: z.string(),
  toolName: z.string(),
  output: toolResultOutputSchema,
  providerOptions: providerOptionsSchema.optional(),
}) as z.ZodType<ToolResultPart>

export const modelMessageSchema = z
  .union([
    z.object({
      role: z.literal('system'),
      content: z.string(),
    }),
    z.object({
      role: z.literal('user'),
      content: z.union([
        z.string(),
        z.array(z.union([textPartSchema, imagePartSchema, filePartSchema])),
      ]),
    }),
    z.object({
      role: z.literal('assistant'),
      content: z.union([
        z.string(),
        z.array(
          z.union([
            textPartSchema,
            filePartSchema,
            reasoningPartSchema,
            toolCallPartSchema,
            toolResultPartSchema,
          ]),
        ),
      ]),
    }),
    z.object({
      role: z.literal('tool'),
      content: z.array(toolResultPartSchema),
    }),
  ])
  .and(
    z.object({
      providerOptions: providerOptionsSchema.optional(),
    }),
  )
