import type { ToolCallPart, ToolResultPart } from 'ai'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { APICallError } from '@ai-sdk/provider'
import Ajv from 'ajv'
import { z } from 'zod/v4'

import type { SuperJSONResult } from '@cared/shared'
import log from '@cared/log'
import { getModel } from '@cared/providers/providers'
import { serializeError, sharedV2ProviderOptionsSchema, SuperJSON } from '@cared/shared'

import type { LanguageModelV2StreamPart } from '@ai-sdk/provider'
import { ProviderKeyManager, ProviderKeyState } from '../../../operation'

const ajv = new Ajv({ allErrors: true })

export const jsonSchema7Schema = z
  .record(z.string(), z.any())
  .refine((schema) => ajv.validateSchema(schema), 'Invalid JSON Schema')

const languageModelV2FunctionToolSchema = z.object({
  type: z.literal('function'),
  name: z.string(),
  description: z.string().optional(),
  inputSchema: jsonSchema7Schema,
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
})

const languageModelV2ProviderDefinedToolSchema = z.object({
  type: z.literal('provider-defined'),
  id: z.templateLiteral([z.string(), '.', z.string()]),
  name: z.string(),
  args: z.record(z.string(), z.unknown()),
})

const languageModelV2ToolChoiceSchema = z.union([
  z.object({
    type: z.enum(['auto', 'none', 'required']),
  }),
  z.object({
    type: z.literal('tool'),
    toolName: z.string(),
  }),
])

const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
})

const filePartSchema = z.object({
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

const reasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
})

const toolCallPartSchema = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
  providerExecuted: z.boolean().optional(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
}) as z.ZodType<ToolCallPart>

const toolResultContentSchema = z.union([
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
  output: toolResultContentSchema,
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
}) as z.ZodType<ToolResultPart>

const languageModelV2MessageSchema = z
  .union([
    z.object({
      role: z.literal('system'),
      content: z.string(),
    }),
    z.object({
      role: z.literal('user'),
      content: z.array(z.union([textPartSchema, filePartSchema])),
    }),
    z.object({
      role: z.literal('assistant'),
      content: z.array(
        z.union([
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

const requestArgsSchema = z.object({
  modelId: z.string(),
  stream: z.boolean(),

  prompt: z.array(languageModelV2MessageSchema),

  maxOutputTokens: z.number().optional(),
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
  tools: z
    .array(
      z.union([
        languageModelV2FunctionToolSchema,
        languageModelV2ProviderDefinedToolSchema,
      ]),
    )
    .optional(),
  toolChoice: languageModelV2ToolChoiceSchema.optional(),
  includeRawChunks: z.boolean().optional(),

  headers: z.record(z.string(), z.string().or(z.undefined())).optional(),

  providerOptions: sharedV2ProviderOptionsSchema.optional(),
})

export async function GET(req: NextRequest): Promise<Response> {
  const searchParams = req.nextUrl.searchParams
  const modelId = searchParams.get('modelId')
  if (!modelId) {
    return new Response('`modelId` is required', {
      status: 400,
    })
  }

  const model = getModel(modelId, 'language')
  if (!model) {
    return new Response('Model not found', {
      status: 404,
    })
  }

  const {
    // eslint-disable-next-line @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars
    doGenerate,
    // eslint-disable-next-line @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars
    doStream,
    supportedUrls,
    ...modelConfig
  } = model

  return makeResponseJson({
    ...modelConfig,
    supportedUrls: Object.entries(await supportedUrls).map(([mediaType, regexArray]) => [
      mediaType,
      regexArray.map((regex) => regex.toString()),
    ]),
  })
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const validatedArgs = requestArgsSchema.safeParse(await requestJson(req))
    if (!validatedArgs.success) {
      return makeResponseJson(
        {
          errors: validatedArgs.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      )
    }

    const { modelId, stream: doStream, ...languageModelV2CallOptions } = validatedArgs.data

    const model = getModel(modelId, 'language')
    if (!model) {
      return new Response('Model not found', {
        status: 404,
      })
    }

    if (doStream) {
      const { stream, ...metadata } = await model.doStream({
        ...languageModelV2CallOptions,
        abortSignal: req.signal,
      })

      // Use a TransformStream to prepend metadata
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()

      async function write(data: any) {
        await writer.write(`${JSON.stringify(data)}\n`)
      }

      // @ts-expect-error: type 'metadata' must not be in LanguageModelV2StreamPart
      const _: LanguageModelV2StreamPart['type'] = 'metadata'

      void write({
        type: 'metadata',
        ...metadata,
      })

      // Pipe the original stream through the transformer
      stream
        .pipeTo(
          new WritableStream({
            async write(part) {
              if (part.type === 'error' && part.error instanceof Error) {
                // Serialize error to ensure it can be properly transferred across the network
                part.error = serializeError(part.error)
                ;(part as any).errorSerialized = true
              }
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
          await writer.abort(err instanceof Error ? err.message : err?.toString()) // Abort the transformer if the source errors
        })

      // Return the transformed stream (metadata + original content)
      return new Response(readable.pipeThrough(new TextEncoderStream()), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8', // Vercel AI SDK stream protocol type
        },
      })
    } else {
      try {
        const result = await model.doGenerate({
          ...languageModelV2CallOptions,
          abortSignal: req.signal,
        })
        return makeResponseJson(result)
      } catch (error: any) {
        if (error instanceof Error) {
          return makeResponseJson(
            {
              // Serialize error to ensure it can be properly transferred across the network
              error: serializeError(error),
              errorSerialized: true,
            },
            { status: 500 },
          )
        } else {
          throw error
        }
      }
    }
  } catch (error: any) {
    log.error('Call language model error', error)
    return makeResponseJson(
      {
        error: error.message || 'An unknown error occurred',
      },
      { status: 500 },
    )
  }
}

export async function requestJson(request: NextRequest): Promise<object> {
  return SuperJSON.deserialize((await request.json()) as SuperJSONResult)
}

export function makeResponseJson<JsonBody>(
  body: JsonBody,
  init?: ResponseInit,
): NextResponse<SuperJSONResult> {
  return NextResponse.json(SuperJSON.serialize(body), init)
}

export function handleError(
  keyManager: ProviderKeyManager,
  key: ProviderKeyState,
  error: any,
  details: {
    latency: number
  },
) {
  if (APICallError.isInstance(error)) {
    const statusCode = error.statusCode

    keyManager.updateState(key, {
      success: false,
      latency: details.latency,
      retryAfter:
        statusCode === 429
          ? error.responseHeaders?.['Retry-After'] || error.responseHeaders?.['X-Retry-After']
          : undefined,
    })

    if (
      // unauthorized
      statusCode === 401 ||
      // forbidden
      statusCode === 403 ||
      // request timeout
      statusCode === 408 ||
      // too many requests
      statusCode === 429 ||
      // server error
      (statusCode && statusCode >= 500)
    ) {
      return true
    }
  } else {
    keyManager.updateState(key, {
      success: false,
      latency: details.latency,
    })
  }

  return false
}
