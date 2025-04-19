import type { UIMessage as _UIMessage, ToolCall, ToolResult } from 'ai'
import { z } from 'zod'

import { jsonValueSchema, providerMetadataSchema } from './schema'

export type UIMessage = Pick<
  _UIMessage,
  'id' | 'createdAt' | 'content' | 'parts' | 'experimental_attachments' | 'annotations'
> & {
  role: 'system' | 'user' | 'assistant'
}

export type MessageContent = Pick<
  UIMessage,
  'content' | 'parts' | 'experimental_attachments' | 'annotations'
>

const toolCallSchema = z.object({
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.any(),
}) as z.ZodType<ToolCall<string, any>>

const toolResultSchema = toolCallSchema.and(
  z.object({
    result: z.any(),
  }),
) as z.ZodType<ToolResult<string, any, any>>

export const messageContentSchema = z.object({
  content: z.string().default(''),
  parts: z.array(
    z.union([
      z.object({ type: z.literal('text'), text: z.string() }),
      z.object({
        type: z.literal('reasoning'),
        reasoning: z.string(),
        details: z.array(
          z.union([
            z.object({
              type: z.literal('text'),
              text: z.string(),
              signature: z.string().optional(),
            }),
            z.object({ type: z.literal('redacted'), data: z.string() }),
          ]),
        ),
      }),
      z.object({
        type: z.literal('tool-invocation'),
        toolInvocation: z.union([
          z
            .object({
              state: z.literal('partial-call'),
              step: z.number().optional(),
            })
            .and(toolCallSchema),
          z
            .object({
              state: z.literal('call'),
              step: z.number().optional(),
            })
            .and(toolCallSchema),
          z
            .object({
              state: z.literal('result'),
              step: z.number().optional(),
            })
            .and(toolResultSchema),
        ]),
      }),
      z.object({
        type: z.literal('source'),
        source: z.object({
          sourceType: z.literal('url'),
          id: z.string(),
          url: z.string(),
          title: z.string().optional(),
          providerMetadata: providerMetadataSchema.optional(),
        }),
      }),
      z.object({
        type: z.literal('file'),
        mimeType: z.string(),
        data: z.string(),
      }),
      z.object({ type: z.literal('step-start') }),
    ]),
  ),
  experimental_attachments: z
    .array(
      z.object({
        name: z.string().optional(),
        contentType: z.string().optional(),
        url: z.string(),
      }),
    )
    .optional(),
  annotations: z.array(jsonValueSchema).optional(),
})

export const messageRoleEnumValues = ['system', 'user', 'assistant'] as const

export const uiMessageSchema = z
  .object({
    id: z.string(),
    createdAt: z.coerce.date().optional(),
    role: z.enum(messageRoleEnumValues),
  })
  .merge(messageContentSchema)
