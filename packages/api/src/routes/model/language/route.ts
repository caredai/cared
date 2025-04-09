import type { JSONValue, ToolCallPart, ToolResultPart } from 'ai'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { convertBase64ToUint8Array } from '@ai-sdk/provider-utils'
import Ajv from 'ajv'
import { z } from 'zod'

import log from '@ownxai/log'
import { getModel } from '@ownxai/providers/providers'

const ajv = new Ajv({ allErrors: true })

const jsonSchema7Schema = z
  .object({})
  .refine((schema) => ajv.validateSchema(schema), 'Invalid JSON Schema')

const languageModelV1FunctionToolSchema = z.object({
  type: z.literal('function'),
  name: z.string(),
  description: z.string().optional(),
  parameters: jsonSchema7Schema,
})

const languageModelV1ProviderDefinedToolSchema = z.object({
  type: z.literal('provider-defined'),
  id: z.custom<`${string}.${string}`>((val) => {
    return typeof val === 'string' ? /^\w+\.\w+$/.test(val) : false
  }),
  name: z.string(),
  args: z.record(z.unknown()),
})

const languageModelV1ToolChoiceSchema = z.union([
  z.object({
    type: z.enum(['auto', 'none', 'required']),
  }),
  z.object({
    type: z.literal('tool'),
    toolName: z.string(),
  }),
])

const jsonValueSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.string(),
    z.number(),
    z.boolean(),
    z.record(z.string(), jsonValueSchema),
    z.array(jsonValueSchema),
  ]),
)

const providerMetadataSchema = z.record(z.string(), z.record(z.string(), jsonValueSchema))

const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  providerMetadata: providerMetadataSchema.optional(),
})

const imagePartSchema = z.object({
  type: z.literal('image'),
  image: z.union([
    z.string().transform(convertBase64ToUint8Array),
    z
      .string()
      .url()
      .transform((url) => new URL(url)),
  ]),
  mimeType: z.string().optional(),
  providerMetadata: providerMetadataSchema.optional(),
})

const filePartSchema = z.object({
  type: z.literal('file'),
  data: z.union([
    z.string(),
    z
      .string()
      .url()
      .transform((url) => new URL(url)),
  ]),
  filename: z.string().optional(),
  mimeType: z.string(),
  providerMetadata: providerMetadataSchema.optional(),
})

const reasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
  signature: z.string().optional(),
  providerMetadata: providerMetadataSchema.optional(),
})

const redactedReasoningPartSchema = z.object({
  type: z.literal('redacted-reasoning'),
  data: z.string(),
  providerMetadata: providerMetadataSchema.optional(),
})

const toolCallPartSchema = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.unknown(),
  providerMetadata: providerMetadataSchema.optional(),
}) as z.ZodType<ToolCallPart>

const toolResultContentSchema = z.array(
  z.union([
    z.object({ type: z.literal('text'), text: z.string() }),
    z.object({
      type: z.literal('image'),
      data: z.string(),
      mimeType: z.string().optional(),
    }),
  ]),
)

const toolResultPartSchema = z.object({
  type: z.literal('tool-result'),
  toolCallId: z.string(),
  toolName: z.string(),
  result: z.unknown(),
  content: toolResultContentSchema.optional(),
  isError: z.boolean().optional(),
  providerMetadata: providerMetadataSchema.optional(),
}) as z.ZodType<ToolResultPart>

const languageModelV1MessageSchema = z
  .union([
    z.object({
      role: z.literal('system'),
      content: z.string(),
    }),
    z.object({
      role: z.literal('user'),
      content: z.array(z.union([textPartSchema, imagePartSchema, filePartSchema])),
    }),
    z.object({
      role: z.literal('assistant'),
      content: z.array(
        z.union([
          textPartSchema,
          filePartSchema,
          reasoningPartSchema,
          redactedReasoningPartSchema,
          toolCallPartSchema,
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
      providerMetadata: providerMetadataSchema.optional(),
    }),
  )

const requestArgsSchema = z.object({
  modelId: z.string(),
  stream: z.boolean(),

  prompt: z.array(languageModelV1MessageSchema),

  inputFormat: z.enum(['messages', 'prompt']),
  mode: z.union([
    z.object({
      type: z.literal('regular'),
      tools: z
        .array(
          z.union([
            languageModelV1FunctionToolSchema,
            languageModelV1ProviderDefinedToolSchema,
          ]),
        )
        .optional(),
      toolChoice: languageModelV1ToolChoiceSchema.optional(),
    }),
    z.object({
      type: z.literal('object-json'),
      schema: jsonSchema7Schema.optional(),
      name: z.string().optional(),
      description: z.string().optional(),
    }),
    z.object({
      type: z.literal('object-tool'),
      tool: languageModelV1FunctionToolSchema,
    }),
  ]),

  // fields from LanguageModelV1CallSettings
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  stopSequences: z.array(z.string()).optional(),
  topP: z.number().optional(),
  topK: z.number().optional(),
  presencePenalty: z.number().optional(),
  frequencyPenalty: z.number().optional(),
  responseFormat: z
    .union([
      z.object({
        type: z.literal('text'),
      }),
      z.object({
        type: z.literal('json'),
        schema: jsonSchema7Schema.optional(),
        name: z.string().optional(),
        description: z.string().optional(),
      }),
    ])
    .optional(),
  seed: z.number().optional(),
  abortSignal: z.any().optional(), // AbortSignal
  headers: z.record(z.string().or(z.undefined())).optional(),

  providerMetadata: providerMetadataSchema.optional(),
})

export function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const modelId = searchParams.get('modelId')
  if (!modelId) {
    return new Response('modelId is required', {
      status: 400,
    })
  }

  const model = getModel(modelId, 'language')
  if (!model) {
    return new Response('Model not found', {
      status: 404,
    })
  }

  const url = searchParams.get('supportsUrl')
  if (url) {
    const supports = model.supportsUrl?.(new URL(url)) ?? false
    return NextResponse.json({ supports })
  }

  const {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    doGenerate: _doGenerate,
    // eslint-disable-next-line @typescript-eslint/unbound-method
    doStream: _doStream,
    // eslint-disable-next-line @typescript-eslint/unbound-method
    supportsUrl: _supportsUrl,
    ...modelConfig
  } = model
  return NextResponse.json(modelConfig)
}

export async function POST(req: NextRequest) {
  try {
    const validatedArgs = requestArgsSchema.safeParse(await req.json())
    if (!validatedArgs.success) {
      return new Response(
        JSON.stringify({
          errors: validatedArgs.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const { modelId, stream: doStream, ...languageModelV1CallOptions } = validatedArgs.data

    const model = getModel(modelId, 'language')
    if (!model) {
      return new Response('Model not found', {
        status: 404,
      })
    }

    if (doStream) {
      const { stream, ...metadata } = await model.doStream({
        ...languageModelV1CallOptions,
        abortSignal: req.signal,
      })

      // Use a TransformStream to prepend metadata
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()

      async function write(data: any) {
        await writer.write(`${JSON.stringify(data)}\n`)
      }

      await write({
        type: 'metadata',
        ...metadata,
      })

      // Pipe the original stream through the transformer
      stream
        .pipeTo(
          new WritableStream({
            async write(part) {
              await write(part)
            },
            async close() {
              await writer.close()
            },
            async abort(reason) {
              await writer.abort(reason)
            },
          }),
        )
        .catch(async (err) => {
          log.error('Error piping original stream', err)
          await writer.abort(err) // Abort the transformer if the source errors
        })

      // Return the transformed stream (metadata + original content)
      return new Response(readable.pipeThrough(new TextEncoderStream()), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8', // Vercel AI SDK stream protocol type
        },
      })
    } else {
      const result = await model.doGenerate({
        ...languageModelV1CallOptions,
        abortSignal: req.signal,
      })
      return NextResponse.json(result)
    }
  } catch (error: any) {
    log.error('Call language model error', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error.message || 'An unknown error occurred',
      },
      { status: 500 },
    )
  }
}
