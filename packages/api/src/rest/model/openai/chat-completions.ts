import type {
  LanguageModelV2CallOptions,
  LanguageModelV2FinishReason,
  LanguageModelV2Usage,
  SharedV2ProviderMetadata,
} from '@ai-sdk/provider'
import type { NextRequest } from 'next/server'
import type { OpenAI } from 'openai'
import { z } from 'zod/v4'

import { getModel } from '@cared/providers/providers'
import { generateId } from '@cared/shared'

import { jsonSchema7Schema } from '../ai/language'
import {
  ChatCompletionContentPartTextSchema,
  ChatCompletionMessageSchema,
  convertToLanguageModelV2Messages,
} from './chat-prompt'

const ChatCompletionRequestArgsSchema = z.object({
  messages: z.array(ChatCompletionMessageSchema),
  model: z.string(),
  frequency_penalty: z.number().min(-2).max(2).nullish(),
  function_call: z.union([
    z.enum(['none', 'auto']),
    z.object({
      name: z.string(),
    }),
  ]),
  functions: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        parameters: jsonSchema7Schema.optional(),
      }),
    )
    .optional(),
  logit_bias: z.record(z.coerce.number<string>(), z.number()).optional(),
  logprobs: z.boolean().nullish(),
  max_completion_tokens: z.int().nullish(),
  max_tokens: z.int().nullish(),
  metadata: z.record(z.string().max(64), z.string().max(512)).optional(),
  modalities: z.array(z.string()).optional(),
  n: z.int().optional(),
  parallel_tool_calls: z.boolean().optional(),
  prediction: z
    .object({
      type: z.literal('content'),
      content: z.union([z.string(), ChatCompletionContentPartTextSchema]),
    })
    .optional(),
  presence_penalty: z.number().min(-2).max(2).nullish(),
  prompt_cache_key: z.string().optional(),
  reasoning_effort: z.enum(['low', 'medium', 'high']).nullish(),
  response_format: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('text'),
    }),
    z.object({
      type: z.literal('json_schema'),
      json_schema: z.object({
        name: z.string(),
        description: z.string().optional(),
        schema: jsonSchema7Schema,
        strict: z.boolean().nullish(),
      }),
    }),
    z.object({
      type: z.literal('json_object'),
    }),
  ]),
  safety_identifier: z.string().optional(),
  seed: z.int().optional(),
  service_tier: z.enum(['auto', 'default', 'flex', 'priority']).nullish(),
  stop: z.union([z.string(), z.array(z.string())]).nullish(),
  stream: z.boolean().nullish(),
  stream_options: z
    .object({
      include_obfuscation: z.boolean().optional(),
      include_usage: z.boolean().optional(),
    })
    .nullish(),
  temperature: z.number().min(0).max(2).nullish(),
  tool_choice: z
    .union([
      z.enum(['none', 'auto', 'required']),
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('allowed_tools'),
          allowed_tools: z.object({
            mode: z.enum(['auto', 'required']),
            tools: z.array(
              z.object({
                type: z.literal('function'),
                function: z.object({
                  name: z.string(),
                }),
              }),
            ),
          }),
        }),
        z.object({
          type: z.literal('function'),
          function: z.object({
            name: z.string(),
          }),
        }),
      ]),
    ])
    .optional(),
  tools: z
    .array(
      z.object({
        type: z.literal('function'),
        function: z.object({
          name: z.string(),
          description: z.string().optional(),
          parameters: jsonSchema7Schema,
          strict: z.boolean().nullish(),
        }),
      }),
    )
    .optional(),
  top_logprobs: z.int().min(0).max(20).nullish(),
  top_p: z.number().min(0).max(1).nullish(),
  user: z.string().optional(),
  verbosity: z.enum(['low', 'medium', 'high']).optional(),
  web_search_options: z.object({
    search_context_size: z.enum(['low', 'medium', 'high']).optional(),
    user_location: z.object({
      type: z.literal('approximate'),
      approximate: z.object({
        city: z.string().optional(),
        country: z.string().optional(),
        region: z.string().optional(),
        timezone: z.string().optional(),
      }),
    }),
  }),
})

export async function POST(req: NextRequest): Promise<Response> {
  const validatedArgs = ChatCompletionRequestArgsSchema.safeParse(await req.json())
  if (!validatedArgs.success) {
    return new Response(z.prettifyError(validatedArgs.error), { status: 400 })
  }

  const { messages, model: modelId, stream: doStream, ...args } = validatedArgs.data

  // TODO
  const providerId = ''
  const model = getModel(modelId, 'language')
  if (!model) {
    return new Response('Model not found', {
      status: 400,
    })
  }

  const callOptions: LanguageModelV2CallOptions = {
    prompt: convertToLanguageModelV2Messages(messages),
    maxOutputTokens: args.max_completion_tokens ?? args.max_tokens ?? undefined,
    temperature: args.temperature ?? undefined,
    stopSequences: args.stop ? (Array.isArray(args.stop) ? args.stop : [args.stop]) : undefined,
    topP: args.top_p ?? undefined,
    presencePenalty: args.presence_penalty ?? undefined,
    frequencyPenalty: args.frequency_penalty ?? undefined,
    responseFormat:
      args.response_format.type === 'text'
        ? { type: 'text' }
        : {
            type: 'json',
            ...(args.response_format.type === 'json_schema' && {
              schema: args.response_format.json_schema.schema,
              name: args.response_format.json_schema.name,
              description: args.response_format.json_schema.description,
            }),
          },
    seed: args.seed ?? undefined,
    tools: args.tools?.map((tool) => ({
      type: 'function',
      name: tool.function.name,
      description: tool.function.description,
      inputSchema: tool.function.parameters,
    })),
    toolChoice: args.tool_choice
      ? args.tool_choice === 'none' ||
        args.tool_choice === 'auto' ||
        args.tool_choice === 'required'
        ? { type: args.tool_choice }
        : args.tool_choice.type === 'function'
          ? { type: 'tool', toolName: args.tool_choice.function.name }
          : {
              type: args.tool_choice.allowed_tools.mode,
            }
      : undefined,
    abortSignal: req.signal,
    providerOptions: {
      [providerId]: {
        logitBias: args.logit_bias ?? null,
        logprobs:
          typeof args.top_logprobs === 'number' ? args.top_logprobs : (args.logprobs ?? null),
        user: args.user ?? null,
        parallelToolCalls: args.parallel_tool_calls ?? null,
        reasoningEffort: args.reasoning_effort ?? null,
        structuredOutputs: args.response_format.type === 'json_schema' ? true : null,
        serviceTier: args.service_tier ?? null,
        strictJsonSchema:
          (args.response_format.type === 'json_schema' &&
            args.response_format.json_schema.strict) ??
          null,
      },
    },
  }

  if (!doStream) {
    const gen = await model.doGenerate(callOptions)

    const content = gen.content.find((part) => part.type === 'text')?.text ?? null
    const toolCalls = gen.content
      .filter((part) => part.type === 'tool-call')
      .map((part) => ({
        type: 'function' as const,
        id: part.toolCallId,
        function: {
          name: part.toolName,
          arguments: part.input,
        },
      }))

    const rawResponse: any = gen.response?.body
    const logprobs =
      gen.providerMetadata?.[providerId]?.logprobs ?? rawResponse?.choices?.at(0)?.logprobs?.content

    const finishReason = chatCompletionsFinishReason(gen.finishReason)

    const response: OpenAI.ChatCompletion = {
      id: gen.response?.id ?? generateId('chatcmpl', '-'),
      created: Math.floor(+(gen.response?.timestamp ?? new Date()) / 1000),
      model: modelId,
      object: 'chat.completion',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
            tool_calls: toolCalls,
            refusal: null,
            annotations: [],
            audio: null,
          },
          logprobs: logprobs
            ? {
                content: logprobs,
                refusal: null,
              }
            : null,
          finish_reason: finishReason,
        },
      ],
      usage: chatCompletionsUsage(gen.usage, providerId, gen.providerMetadata, rawResponse?.usage),
      service_tier: rawResponse?.service_tier,
      system_fingerprint: rawResponse?.system_fingerprint,
    }

    return Response.json({
      ...response,
      warnings: gen.warnings,
    })
  } else {
    const { stream } = await model.doStream({
      ...callOptions,
      includeRawChunks: true,
    })

    // Create a TransformStream to convert LanguageModelV2StreamPart to OpenAI streaming format
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // Helper function to write data to the stream
    async function write(data: any) {
      // SSE format
      await writer.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    // Process the stream and convert to OpenAI format
    const reader = stream.getReader()

    // Track state for building the response
    let responseMeta: Pick<OpenAI.ChatCompletionChunk, 'id' | 'model' | 'created' | 'object'>
    const toolCallIndices = new Map<string, number>()

    // Process the stream
    async function processStream() {
      try {
        while (true) {
          const { value: part, done } = await reader.read()

          if (done) {
            await write('[DONE]')
            break
          }

          // Process different types of stream parts
          switch (part.type) {
            case 'stream-start': {
              const chunk = {
                ...responseMeta,
                choices: [],
                warnings: part.warnings,
              }
              await write(chunk)
              break
            }

            case 'response-metadata':
              responseMeta = {
                id: part.id ?? generateId('chatcmpl', '-'),
                created: Math.floor(+(part.timestamp ?? new Date()) / 1000),
                model: modelId,
                object: 'chat.completion.chunk',
              }
              break

            case 'text-start': {
              // Nothing
              break
            }

            case 'text-delta':
              if (part.delta) {
                const chunk: OpenAI.ChatCompletionChunk = {
                  ...responseMeta,
                  choices: [
                    {
                      index: 0,
                      delta: { content: part.delta, role: 'assistant' },
                      finish_reason: null,
                    },
                  ],
                }
                await write(chunk)
              }
              break

            case 'text-end':
              break

            case 'reasoning-start':
              break

            case 'reasoning-delta':
              break

            case 'reasoning-end':
              break

            case 'tool-input-start': {
              if (toolCallIndices.has(part.id)) {
                continue
              }
              const index = toolCallIndices.size
              toolCallIndices.set(part.id, index)

              const chunk: OpenAI.ChatCompletionChunk = {
                ...responseMeta,
                choices: [
                  {
                    index: 0,
                    delta: {
                      tool_calls: [
                        {
                          index,
                          id: part.id,
                          type: 'function',
                          function: {
                            name: part.toolName,
                          },
                        },
                      ],
                    },
                    finish_reason: null,
                  },
                ],
              }
              await write(chunk)
              break
            }

            case 'tool-input-delta': {
              const index = toolCallIndices.get(part.id)
              if (index === undefined) {
                continue
              }

              const chunk: OpenAI.ChatCompletionChunk = {
                ...responseMeta,
                choices: [
                  {
                    index: 0,
                    delta: {
                      // Many of these fields are only set for the first delta of each tool call,
                      // like id, function.name, and type.
                      tool_calls: [
                        {
                          index,
                          id: undefined,
                          type: undefined,
                          function: {
                            name: undefined,
                            arguments: part.delta,
                          },
                        },
                      ],
                    },
                    finish_reason: null,
                  },
                ],
              }
              await write(chunk)
              break
            }

            case 'tool-input-end':
              break

            case 'tool-call':
              break

            case 'tool-result':
              break

            case 'file':
              break

            case 'source':
              break

            case 'raw':
              break

            case 'error': {
              break
            }

            case 'finish': {
              const chunk: OpenAI.ChatCompletionChunk = {
                ...responseMeta,
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: chatCompletionsFinishReason(part.finishReason),
                  },
                ],
                usage: chatCompletionsUsage(part.usage, providerId, part.providerMetadata),
              }
              await write(chunk)
              break
            }
          }
        }
      } catch (error) {
        const errorChunk = {
          error: {
            message: error instanceof Error ? error.message : JSON.stringify(error),
          },
        }
        await write(errorChunk)
      } finally {
        await writer.close()
      }
    }

    // Start processing the stream
    void processStream()

    // Return the streaming response
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }
}

function chatCompletionsFinishReason(finishReason: LanguageModelV2FinishReason) {
  switch (finishReason) {
    case 'stop':
      return 'stop'
    case 'length':
      return 'length'
    case 'content-filter':
      return 'content_filter'
    case 'tool-calls':
      return 'tool_calls'
  }
  return 'stop'
}

function chatCompletionsUsage(
  usage: LanguageModelV2Usage,
  providerId: string,
  providerMetadata?: SharedV2ProviderMetadata,
  rawUsage?: any,
): OpenAI.ChatCompletion['usage'] {
  return {
    prompt_tokens: usage.inputTokens ?? 0,
    completion_tokens: usage.outputTokens ?? 0,
    total_tokens: usage.totalTokens ?? 0,
    completion_tokens_details: {
      reasoning_tokens: usage.reasoningTokens ?? 0,
      accepted_prediction_tokens: (providerMetadata?.[providerId]?.acceptedPredictionTokens ??
        rawUsage?.completion_tokens_details?.accepted_prediction_tokens ??
        0) as number,
      rejected_prediction_tokens: (providerMetadata?.[providerId]?.rejectedPredictionTokens ??
        rawUsage?.completion_tokens_details?.rejected_prediction_tokens ??
        0) as number,
      audio_tokens: rawUsage?.completion_tokens_details?.audio_tokens ?? 0,
    },
    prompt_tokens_details: {
      cached_tokens: usage.cachedInputTokens ?? 0,
      audio_tokens: rawUsage?.prompt_tokens_details?.audio_tokens ?? 0,
    },
  }
}
