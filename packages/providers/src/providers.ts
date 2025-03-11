import { bedrock, createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { azure, createAzure } from '@ai-sdk/azure'
import { cerebras, createCerebras } from '@ai-sdk/cerebras'
import { cohere, createCohere } from '@ai-sdk/cohere'
import { createDeepInfra, deepinfra } from '@ai-sdk/deepinfra'
import { createDeepSeek, deepseek } from '@ai-sdk/deepseek'
import { createFireworks, fireworks } from '@ai-sdk/fireworks'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createVertex, vertex } from '@ai-sdk/google-vertex'
import { createGroq, groq } from '@ai-sdk/groq'
import { createLuma, luma } from '@ai-sdk/luma'
import { createMistral, mistral } from '@ai-sdk/mistral'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createPerplexity, perplexity } from '@ai-sdk/perplexity'
import { createReplicate, replicate } from '@ai-sdk/replicate'
import { createTogetherAI, togetherai } from '@ai-sdk/togetherai'
import { createXai, xai } from '@ai-sdk/xai'
import { createOpenRouter, openrouter } from '@openrouter/ai-sdk-provider'

import type { Provider, ProviderId } from './types'

export const providers: Record<ProviderId, Provider> = {
  openai: openai,
  anthropic: anthropic,
  deepseek: deepseek,
  azure: azure,
  bedrock: bedrock,
  google: google,
  vertex: vertex,
  mistral: mistral,
  xai: xai,
  togetherai: togetherai,
  cohere: cohere,
  fireworks: fireworks,
  deepinfra: deepinfra,
  cerebras: cerebras,
  groq: groq,
  replicate: replicate,
  perplexity: perplexity,
  luma: luma,
  openrouter: openrouter,
}

export {
  createOpenAI,
  createAnthropic,
  createDeepSeek,
  createAzure,
  createAmazonBedrock,
  createGoogleGenerativeAI,
  createVertex,
  createMistral,
  createXai,
  createTogetherAI,
  createCohere,
  createFireworks,
  createDeepInfra,
  createCerebras,
  createGroq,
  createReplicate,
  createPerplexity,
  createLuma,
  createOpenRouter,
}
