import type { EmbeddingModelV1, ImageModelV1, LanguageModelV1 } from '@ai-sdk/provider'
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

export * from './default'

export interface Provider {
  languageModel?(modelId: string): LanguageModelV1

  textEmbeddingModel?(modelId: string): EmbeddingModelV1<string>

  image?(modelId: string): ImageModelV1
}

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'azure'
  | 'bedrock'
  | 'google'
  | 'vertex'
  | 'mistral'
  | 'xai'
  | 'togetherai'
  | 'cohere'
  | 'fireworks'
  | 'deepinfra'
  | 'cerebras'
  | 'groq'
  | 'replicate'
  | 'perplexity'
  | 'luma'

export interface ProviderInfo {
  id: ProviderId
  name: string
  languageModels?: ModelInfo[]
  textEmbeddingModels?: (ModelInfo & { dimensions?: number })[]
  imageModels?: ModelInfo[]
}

export interface ModelInfo {
  id: string
  name: string
  description: string
  dimensions?: number
}

export const providerInfos: ProviderInfo[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    languageModels: [
      { id: 'o1', name: 'O1', description: 'Latest O1 model' },
      { id: 'o1-2024-12-17', name: 'O1 (Dec 2024)', description: 'December 2024 version of O1' },
      { id: 'o1-mini', name: 'O1 Mini', description: 'Lightweight O1 model' },
      {
        id: 'o1-mini-2024-09-12',
        name: 'O1 Mini (Sep 2024)',
        description: 'September 2024 version of O1 Mini',
      },
      { id: 'o1-preview', name: 'O1 Preview', description: 'Preview version of O1' },
      {
        id: 'o1-preview-2024-09-12',
        name: 'O1 Preview (Sep 2024)',
        description: 'September 2024 preview version',
      },
      { id: 'o3-mini', name: 'O3 Mini', description: 'O3 Mini model' },
      {
        id: 'o3-mini-2025-01-31',
        name: 'O3 Mini (Jan 2025)',
        description: 'January 2025 version of O3 Mini',
      },
      { id: 'gpt-4o', name: 'GPT-4O', description: 'Base GPT-4O model' },
      {
        id: 'gpt-4o-2024-05-13',
        name: 'GPT-4O (May 2024)',
        description: 'May 2024 version of GPT-4O',
      },
      {
        id: 'gpt-4o-2024-08-06',
        name: 'GPT-4O (Aug 2024)',
        description: 'August 2024 version of GPT-4O',
      },
      {
        id: 'gpt-4o-2024-11-20',
        name: 'GPT-4O (Nov 2024)',
        description: 'November 2024 version of GPT-4O',
      },
      {
        id: 'gpt-4o-audio-preview',
        name: 'GPT-4O Audio Preview',
        description: 'Audio capabilities preview',
      },
      {
        id: 'gpt-4o-audio-preview-2024-10-01',
        name: 'GPT-4O Audio Preview (Oct 2024)',
        description: 'October 2024 audio preview',
      },
      {
        id: 'gpt-4o-audio-preview-2024-12-17',
        name: 'GPT-4O Audio Preview (Dec 2024)',
        description: 'December 2024 audio preview',
      },
      { id: 'gpt-4o-mini', name: 'GPT-4O Mini', description: 'Lightweight GPT-4O model' },
      {
        id: 'gpt-4o-mini-2024-07-18',
        name: 'GPT-4O Mini (Jul 2024)',
        description: 'July 2024 version of GPT-4O Mini',
      },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Latest GPT-4 Turbo model' },
      {
        id: 'gpt-4-turbo-2024-04-09',
        name: 'GPT-4 Turbo (Apr 2024)',
        description: 'April 2024 version of GPT-4 Turbo',
      },
      {
        id: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo Preview',
        description: 'Preview version of GPT-4 Turbo',
      },
      {
        id: 'gpt-4-0125-preview',
        name: 'GPT-4 0125 Preview',
        description: 'January 2024 preview version',
      },
      {
        id: 'gpt-4-1106-preview',
        name: 'GPT-4 1106 Preview',
        description: 'November 2023 preview version',
      },
      { id: 'gpt-4', name: 'GPT-4', description: 'Base GPT-4 model' },
      { id: 'gpt-4-0613', name: 'GPT-4 0613', description: 'June 2023 version of GPT-4' },
      {
        id: 'gpt-3.5-turbo-0125',
        name: 'GPT-3.5 Turbo 0125',
        description: 'January 2024 version of GPT-3.5 Turbo',
      },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Latest GPT-3.5 Turbo model' },
      {
        id: 'gpt-3.5-turbo-1106',
        name: 'GPT-3.5 Turbo 1106',
        description: 'November 2023 version of GPT-3.5 Turbo',
      },
      {
        id: 'gpt-3.5-turbo-instruct',
        name: 'GPT-3.5 Turbo Instruct',
        description: 'Instruction-following version',
      },
    ],
    textEmbeddingModels: [
      {
        id: 'text-embedding-3-small',
        name: 'Text Embedding 3 Small',
        description: 'Efficient embedding model',
        dimensions: 1536,
      },
      {
        id: 'text-embedding-3-large',
        name: 'Text Embedding 3 Large',
        description: 'Most capable embedding model',
        dimensions: 3072,
      },
      {
        id: 'text-embedding-ada-002',
        name: 'Text Embedding Ada 002',
        description: 'Legacy embedding model',
        dimensions: 1536,
      },
    ],
    imageModels: [
      { id: 'dall-e-3', name: 'DALL·E 3', description: 'Most capable image generation model' },
      { id: 'dall-e-2', name: 'DALL·E 2', description: 'Previous generation image model' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    languageModels: [
      {
        id: 'claude-3-5-sonnet-latest',
        name: 'Claude 3.5 Sonnet',
        description: 'Latest Claude 3.5 Sonnet model',
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet (Oct 2024)',
        description: 'October 2024 version of Claude 3.5 Sonnet',
      },
      {
        id: 'claude-3-5-sonnet-20240620',
        name: 'Claude 3.5 Sonnet (Jun 2024)',
        description: 'June 2024 version of Claude 3.5 Sonnet',
      },
      {
        id: 'claude-3-5-haiku-latest',
        name: 'Claude 3.5 Haiku',
        description: 'Latest Claude 3.5 Haiku model',
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku (Oct 2024)',
        description: 'October 2024 version of Claude 3.5 Haiku',
      },
      {
        id: 'claude-3-opus-latest',
        name: 'Claude 3 Opus',
        description: 'Latest Claude 3 Opus model',
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'February 2024 version of Claude 3 Opus',
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'February 2024 version of Claude 3 Sonnet',
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'March 2024 version of Claude 3 Haiku',
      },
    ],
    textEmbeddingModels: [],
    imageModels: [],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    languageModels: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'General purpose chat model' },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        description: 'Specialized reasoning model',
      },
    ],
    textEmbeddingModels: [],
    imageModels: [],
  },
  {
    id: 'azure',
    name: 'Azure OpenAI Service',
    languageModels: [],
    textEmbeddingModels: [],
  },
  {
    id: 'bedrock',
    name: 'Amazon Bedrock',
    languageModels: [
      {
        id: 'amazon.titan-tg1-large',
        name: 'Titan TG1 Large',
        description: 'Large Titan text generation model',
      },
      {
        id: 'amazon.titan-text-express-v1',
        name: 'Titan Text Express',
        description: 'Fast text generation model',
      },
      { id: 'anthropic.claude-v2', name: 'Claude V2', description: 'Claude V2 on Bedrock' },
      {
        id: 'anthropic.claude-v2:1',
        name: 'Claude V2.1',
        description: 'Enhanced Claude V2 on Bedrock',
      },
      {
        id: 'anthropic.claude-instant-v1',
        name: 'Claude Instant',
        description: 'Fast Claude model',
      },
      {
        id: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
        name: 'Claude 3.5 Sonnet',
        description: 'June 2024 version',
      },
      {
        id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        name: 'Claude 3.5 Sonnet',
        description: 'October 2024 version',
      },
      {
        id: 'anthropic.claude-3-5-haiku-20241022-v1:0',
        name: 'Claude 3.5 Haiku',
        description: 'October 2024 version',
      },
      {
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        name: 'Claude 3 Sonnet',
        description: 'February 2024 version',
      },
      {
        id: 'anthropic.claude-3-haiku-20240307-v1:0',
        name: 'Claude 3 Haiku',
        description: 'March 2024 version',
      },
      {
        id: 'anthropic.claude-3-opus-20240229-v1:0',
        name: 'Claude 3 Opus',
        description: 'February 2024 version',
      },
      { id: 'cohere.command-text-v14', name: 'Command Text', description: 'Cohere Command model' },
      {
        id: 'cohere.command-light-text-v14',
        name: 'Command Light Text',
        description: 'Lightweight Command model',
      },
      { id: 'cohere.command-r-v1:0', name: 'Command R', description: 'Command R model' },
      {
        id: 'cohere.command-r-plus-v1:0',
        name: 'Command R Plus',
        description: 'Enhanced Command R model',
      },
      {
        id: 'meta.llama3-70b-instruct-v1:0',
        name: 'Llama 3 70B',
        description: 'Large Llama 3 model',
      },
      { id: 'meta.llama3-8b-instruct-v1:0', name: 'Llama 3 8B', description: 'Base Llama 3 model' },
      {
        id: 'meta.llama3-1-405b-instruct-v1:0',
        name: 'Llama 3.1 405B',
        description: 'Very large Llama 3.1 model',
      },
      {
        id: 'meta.llama3-1-70b-instruct-v1:0',
        name: 'Llama 3.1 70B',
        description: 'Large Llama 3.1 model',
      },
      {
        id: 'meta.llama3-1-8b-instruct-v1:0',
        name: 'Llama 3.1 8B',
        description: 'Base Llama 3.1 model',
      },
      {
        id: 'meta.llama3-2-11b-instruct-v1:0',
        name: 'Llama 3.2 11B',
        description: 'Medium Llama 3.2 model',
      },
      {
        id: 'meta.llama3-2-1b-instruct-v1:0',
        name: 'Llama 3.2 1B',
        description: 'Small Llama 3.2 model',
      },
      {
        id: 'meta.llama3-2-3b-instruct-v1:0',
        name: 'Llama 3.2 3B',
        description: 'Compact Llama 3.2 model',
      },
      {
        id: 'meta.llama3-2-90b-instruct-v1:0',
        name: 'Llama 3.2 90B',
        description: 'Very large Llama 3.2 model',
      },
      {
        id: 'mistral.mistral-7b-instruct-v0:2',
        name: 'Mistral 7B',
        description: 'Mistral instruction model',
      },
      {
        id: 'mistral.mixtral-8x7b-instruct-v0:1',
        name: 'Mixtral 8x7B',
        description: 'Mixtral instruction model',
      },
      {
        id: 'mistral.mistral-large-2402-v1:0',
        name: 'Mistral Large',
        description: 'Large Mistral model',
      },
      {
        id: 'mistral.mistral-small-2402-v1:0',
        name: 'Mistral Small',
        description: 'Small Mistral model',
      },
      {
        id: 'amazon.titan-text-express-v1',
        name: 'Titan Text Express',
        description: 'Fast Titan model',
      },
      {
        id: 'amazon.titan-text-lite-v1',
        name: 'Titan Text Lite',
        description: 'Lightweight Titan model',
      },
    ],
    textEmbeddingModels: [
      {
        id: 'amazon.titan-embed-text-v1',
        name: 'Titan Embed Text',
        description: 'Base Titan embedding model',
        dimensions: 1024,
      },
      {
        id: 'amazon.titan-embed-text-v2:0',
        name: 'Titan Embed Text V2',
        description: 'Enhanced Titan embedding model',
        dimensions: 1024,
      },
      {
        id: 'cohere.embed-english-v3',
        name: 'Cohere Embed English',
        description: 'English embedding model',
        dimensions: 1024,
      },
      {
        id: 'cohere.embed-multilingual-v3',
        name: 'Cohere Embed Multilingual',
        description: 'Multilingual embedding model',
        dimensions: 1024,
      },
    ],
    imageModels: [],
  },
  {
    id: 'google',
    name: 'Google AI',
    languageModels: [
      {
        id: 'gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash',
        description: 'Fast Gemini 2.0 model',
      },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast Gemini 1.5 model' },
      {
        id: 'gemini-1.5-flash-latest',
        name: 'Gemini 1.5 Flash Latest',
        description: 'Latest flash model',
      },
      {
        id: 'gemini-1.5-flash-001',
        name: 'Gemini 1.5 Flash 001',
        description: 'First version of flash model',
      },
      {
        id: 'gemini-1.5-flash-002',
        name: 'Gemini 1.5 Flash 002',
        description: 'Second version of flash model',
      },
      {
        id: 'gemini-1.5-flash-8b',
        name: 'Gemini 1.5 Flash 8B',
        description: '8B parameter flash model',
      },
      {
        id: 'gemini-1.5-flash-8b-latest',
        name: 'Gemini 1.5 Flash 8B Latest',
        description: 'Latest 8B flash model',
      },
      {
        id: 'gemini-1.5-flash-8b-001',
        name: 'Gemini 1.5 Flash 8B 001',
        description: 'First version of 8B flash model',
      },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Pro version' },
      {
        id: 'gemini-1.5-pro-latest',
        name: 'Gemini 1.5 Pro Latest',
        description: 'Latest pro model',
      },
      {
        id: 'gemini-1.5-pro-001',
        name: 'Gemini 1.5 Pro 001',
        description: 'First version of pro model',
      },
      {
        id: 'gemini-1.5-pro-002',
        name: 'Gemini 1.5 Pro 002',
        description: 'Second version of pro model',
      },
      {
        id: 'gemini-2.0-flash-lite-preview-02-05',
        name: 'Gemini 2.0 Flash Lite Preview',
        description: 'Preview of lite flash model',
      },
      {
        id: 'gemini-2.0-pro-exp-02-05',
        name: 'Gemini 2.0 Pro Exp',
        description: 'Experimental pro model',
      },
      {
        id: 'gemini-2.0-flash-thinking-exp-01-21',
        name: 'Gemini 2.0 Flash Thinking',
        description: 'Experimental thinking model',
      },
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash Exp',
        description: 'Experimental flash model',
      },
      {
        id: 'gemini-exp-1206',
        name: 'Gemini Exp 1206',
        description: 'Experimental model from December',
      },
      {
        id: 'learnlm-1.5-pro-experimental',
        name: 'LearnLM 1.5 Pro',
        description: 'Experimental learning model',
      },
    ],
    textEmbeddingModels: [
      {
        id: 'text-embedding-004',
        name: 'Text Embedding 004',
        description: 'Latest embedding model',
        dimensions: 768,
      },
    ],
    imageModels: [],
  },
  {
    id: 'vertex',
    name: 'Google Cloud Vertex AI',
    languageModels: [
      {
        id: 'gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash',
        description: 'Fast Gemini 2.0 model',
      },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast Gemini 1.5 model' },
      {
        id: 'gemini-1.5-flash-001',
        name: 'Gemini 1.5 Flash 001',
        description: 'First version of flash model',
      },
      {
        id: 'gemini-1.5-flash-002',
        name: 'Gemini 1.5 Flash 002',
        description: 'Second version of flash model',
      },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Pro version' },
      {
        id: 'gemini-1.5-pro-001',
        name: 'Gemini 1.5 Pro 001',
        description: 'First version of pro model',
      },
      {
        id: 'gemini-1.5-pro-002',
        name: 'Gemini 1.5 Pro 002',
        description: 'Second version of pro model',
      },
      { id: 'gemini-1.0-pro-001', name: 'Gemini 1.0 Pro 001', description: 'Original pro model' },
      {
        id: 'gemini-1.0-pro-vision-001',
        name: 'Gemini 1.0 Pro Vision',
        description: 'Vision-capable model',
      },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Base Gemini 1.0 Pro model' },
      {
        id: 'gemini-1.0-pro-002',
        name: 'Gemini 1.0 Pro 002',
        description: 'Second version of 1.0 pro model',
      },
      {
        id: 'gemini-2.0-flash-lite-preview-02-05',
        name: 'Gemini 2.0 Flash Lite Preview',
        description: 'Preview of lite flash model',
      },
      {
        id: 'gemini-2.0-pro-exp-02-05',
        name: 'Gemini 2.0 Pro Exp',
        description: 'Experimental pro model',
      },
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash Exp',
        description: 'Experimental flash model',
      },
    ],
    textEmbeddingModels: [
      {
        id: 'textembedding-gecko',
        name: 'Text Embedding Gecko',
        description: 'Base Gecko model',
        dimensions: 768,
      },
      {
        id: 'textembedding-gecko@001',
        name: 'Text Embedding Gecko 001',
        description: 'First version of Gecko',
        dimensions: 768,
      },
      {
        id: 'textembedding-gecko@003',
        name: 'Text Embedding Gecko 003',
        description: 'Third version of Gecko',
        dimensions: 768,
      },
      {
        id: 'textembedding-gecko-multilingual',
        name: 'Text Embedding Gecko Multilingual',
        description: 'Multilingual Gecko model',
        dimensions: 768,
      },
      {
        id: 'textembedding-gecko-multilingual@001',
        name: 'Text Embedding Gecko Multilingual 001',
        description: 'First version of multilingual Gecko',
        dimensions: 768,
      },
      {
        id: 'text-multilingual-embedding-002',
        name: 'Text Multilingual Embedding 002',
        description: 'General multilingual model',
        dimensions: 768,
      },
      {
        id: 'text-embedding-004',
        name: 'Text Embedding 004',
        description: 'Latest embedding model',
        dimensions: 768,
      },
      {
        id: 'text-embedding-005',
        name: 'Text Embedding 005',
        description: 'Next generation embedding model',
        dimensions: 768,
      },
    ],
    imageModels: [
      {
        id: 'imagen-3.0-generate-001',
        name: 'Imagen 3.0',
        description: 'Latest image generation model',
      },
      {
        id: 'imagen-3.0-fast-generate-001',
        name: 'Imagen 3.0 Fast',
        description: 'Fast image generation model',
      },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    languageModels: [
      { id: 'ministral-3b-latest', name: 'Ministral 3B', description: 'Latest Ministral 3B model' },
      { id: 'ministral-8b-latest', name: 'Ministral 8B', description: 'Latest Ministral 8B model' },
      { id: 'mistral-large-latest', name: 'Mistral Large', description: 'Latest large model' },
      { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Latest small model' },
      {
        id: 'pixtral-large-latest',
        name: 'Pixtral Large',
        description: 'Latest Pixtral large model',
      },
      { id: 'pixtral-12b-2409', name: 'Pixtral 12B', description: 'Pixtral 12B model' },
      { id: 'open-mistral-7b', name: 'Open Mistral 7B', description: 'Open source 7B model' },
      {
        id: 'open-mixtral-8x7b',
        name: 'Open Mixtral 8x7B',
        description: 'Open source Mixtral model',
      },
      {
        id: 'open-mixtral-8x22b',
        name: 'Open Mixtral 8x22B',
        description: 'Large open source Mixtral model',
      },
    ],
    textEmbeddingModels: [
      {
        id: 'mistral-embed',
        name: 'Mistral Embed',
        description: 'Mistral embedding model',
        dimensions: 1024,
      },
    ],
    imageModels: [],
  },
  {
    id: 'xai',
    name: 'xAI',
    languageModels: [
      { id: 'grok-2-1212', name: 'Grok 2', description: 'Grok 2 base model' },
      { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', description: 'Vision-capable Grok 2' },
      { id: 'grok-beta', name: 'Grok Beta', description: 'Beta version of Grok' },
      {
        id: 'grok-vision-beta',
        name: 'Grok Vision Beta',
        description: 'Beta version with vision capabilities',
      },
    ],
    textEmbeddingModels: [],
    imageModels: [],
  },
  {
    id: 'togetherai',
    name: 'Together AI',
    languageModels: [
      {
        id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        name: 'Llama 3.3 70B Turbo',
        description: 'Turbo version of Llama 3.3 70B',
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        name: 'Llama 3.1 8B Turbo',
        description: 'Turbo version of Llama 3.1 8B',
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        name: 'Llama 3.1 70B Turbo',
        description: 'Turbo version of Llama 3.1 70B',
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
        name: 'Llama 3.1 405B Turbo',
        description: 'Turbo version of Llama 3.1 405B',
      },
      {
        id: 'meta-llama/Meta-Llama-3-8B-Instruct-Turbo',
        name: 'Llama 3 8B Turbo',
        description: 'Turbo version of Llama 3 8B',
      },
      {
        id: 'meta-llama/Meta-Llama-3-70B-Instruct-Turbo',
        name: 'Llama 3 70B Turbo',
        description: 'Turbo version of Llama 3 70B',
      },
      {
        id: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
        name: 'Llama 3.2 3B Turbo',
        description: 'Turbo version of Llama 3.2 3B',
      },
      {
        id: 'meta-llama/Meta-Llama-3-8B-Instruct-Lite',
        name: 'Llama 3 8B Lite',
        description: 'Lite version of Llama 3 8B',
      },
      {
        id: 'meta-llama/Meta-Llama-3-70B-Instruct-Lite',
        name: 'Llama 3 70B Lite',
        description: 'Lite version of Llama 3 70B',
      },
      {
        id: 'meta-llama/Llama-3-8b-chat-hf',
        name: 'Llama 3 8B Chat',
        description: 'Chat version of Llama 3 8B',
      },
      {
        id: 'meta-llama/Llama-3-70b-chat-hf',
        name: 'Llama 3 70B Chat',
        description: 'Chat version of Llama 3 70B',
      },
      {
        id: 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
        name: 'Nemotron 70B',
        description: 'NVIDIA Nemotron model',
      },
      {
        id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        name: 'Qwen 2.5 Coder 32B',
        description: 'Qwen coding model',
      },
      { id: 'Qwen/QwQ-32B-Preview', name: 'QwQ 32B', description: 'QwQ preview model' },
      {
        id: 'microsoft/WizardLM-2-8x22B',
        name: 'WizardLM 2',
        description: 'Microsoft WizardLM model',
      },
      { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', description: 'Google Gemma 2 27B model' },
      { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', description: 'Google Gemma 2 9B model' },
      { id: 'databricks/dbrx-instruct', name: 'DBRX', description: 'Databricks instruction model' },
      {
        id: 'deepseek-ai/deepseek-llm-67b-chat',
        name: 'DeepSeek 67B',
        description: 'DeepSeek chat model',
      },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: 'Latest DeepSeek model' },
      { id: 'google/gemma-2b-it', name: 'Gemma 2B', description: 'Google Gemma 2B model' },
      { id: 'Gryphe/MythoMax-L2-13b', name: 'MythoMax L2', description: 'MythoMax model' },
      {
        id: 'meta-llama/Llama-2-13b-chat-hf',
        name: 'Llama 2 13B',
        description: 'Llama 2 chat model',
      },
      {
        id: 'mistralai/Mistral-7B-Instruct-v0.1',
        name: 'Mistral 7B v0.1',
        description: 'First version of Mistral',
      },
      {
        id: 'mistralai/Mistral-7B-Instruct-v0.2',
        name: 'Mistral 7B v0.2',
        description: 'Second version of Mistral',
      },
      {
        id: 'mistralai/Mistral-7B-Instruct-v0.3',
        name: 'Mistral 7B v0.3',
        description: 'Third version of Mistral',
      },
      {
        id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        name: 'Mixtral 8x7B',
        description: 'Mixtral instruction model',
      },
      {
        id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
        name: 'Mixtral 8x22B',
        description: 'Large Mixtral model',
      },
      {
        id: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
        name: 'Nous Hermes 2',
        description: 'Nous Research model',
      },
      {
        id: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
        name: 'Qwen 2.5 7B Turbo',
        description: 'Fast Qwen model',
      },
      {
        id: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
        name: 'Qwen 2.5 72B Turbo',
        description: 'Large fast Qwen model',
      },
      { id: 'Qwen/Qwen2-72B-Instruct', name: 'Qwen 2 72B', description: 'Large Qwen 2 model' },
      {
        id: 'upstage/SOLAR-10.7B-Instruct-v1.0',
        name: 'SOLAR 10.7B',
        description: 'SOLAR instruction model',
      },
      { id: 'meta-llama/Llama-2-70b-hf', name: 'Llama 2 70B', description: 'Base Llama 2 model' },
      {
        id: 'mistralai/Mistral-7B-v0.1',
        name: 'Mistral 7B Base',
        description: 'Base Mistral model',
      },
      {
        id: 'mistralai/Mixtral-8x7B-v0.1',
        name: 'Mixtral 8x7B Base',
        description: 'Base large Mixtral model',
      },
      { id: 'Meta-Llama/Llama-Guard-7b', name: 'Llama Guard', description: 'Safety model' },
      {
        id: 'codellama/CodeLlama-34b-Instruct-hf',
        name: 'CodeLlama 34B',
        description: 'Code generation model',
      },
      {
        id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        name: 'Qwen 2.5 Coder',
        description: 'Latest Qwen coding model',
      },
    ],
    textEmbeddingModels: [
      {
        id: 'togethercomputer/m2-bert-80M-2k-retrieval',
        name: 'M2 BERT 2K',
        description: '2K context BERT model',
        dimensions: 768,
      },
      {
        id: 'togethercomputer/m2-bert-80M-32k-retrieval',
        name: 'M2 BERT 32K',
        description: '32K context BERT model',
        dimensions: 768,
      },
      {
        id: 'togethercomputer/m2-bert-80M-8k-retrieval',
        name: 'M2 BERT 8K',
        description: '8K context BERT model',
        dimensions: 768,
      },
      {
        id: 'WhereIsAI/UAE-Large-V1',
        name: 'UAE Large',
        description: 'Large UAE model',
        dimensions: 1024,
      },
      {
        id: 'BAAI/bge-large-en-v1.5',
        name: 'BGE Large English',
        description: 'Large English BGE model',
        dimensions: 1024,
      },
      {
        id: 'BAAI/bge-base-en-v1.5',
        name: 'BGE Base English',
        description: 'Base English BGE model',
        dimensions: 768,
      },
      {
        id: 'sentence-transformers/msmarco-bert-base-dot-v5',
        name: 'MS MARCO BERT',
        description: 'MS MARCO search model',
        dimensions: 768,
      },
      {
        id: 'bert-base-uncased',
        name: 'BERT Base',
        description: 'Base BERT model',
        dimensions: 768,
      },
    ],
    imageModels: [
      {
        id: 'stabilityai/stable-diffusion-xl-base-1.0',
        name: 'SDXL Base',
        description: 'Base SDXL model',
      },
      {
        id: 'black-forest-labs/FLUX.1-dev',
        name: 'FLUX Dev',
        description: 'Development FLUX model',
      },
      {
        id: 'black-forest-labs/FLUX.1-dev-lora',
        name: 'FLUX Dev LoRA',
        description: 'FLUX with LoRA',
      },
      {
        id: 'black-forest-labs/FLUX.1-schnell',
        name: 'FLUX Schnell',
        description: 'Fast FLUX model',
      },
      {
        id: 'black-forest-labs/FLUX.1-canny',
        name: 'FLUX Canny',
        description: 'Edge detection model',
      },
      {
        id: 'black-forest-labs/FLUX.1-depth',
        name: 'FLUX Depth',
        description: 'Depth estimation model',
      },
      {
        id: 'black-forest-labs/FLUX.1-redux',
        name: 'FLUX Redux',
        description: 'Optimized FLUX model',
      },
      {
        id: 'black-forest-labs/FLUX.1.1-pro',
        name: 'FLUX 1.1 Pro',
        description: 'Professional FLUX model',
      },
      { id: 'black-forest-labs/FLUX.1-pro', name: 'FLUX Pro', description: 'Pro FLUX model' },
      {
        id: 'black-forest-labs/FLUX.1-schnell-Free',
        name: 'FLUX Schnell Free',
        description: 'Free fast FLUX model',
      },
    ],
  },
  {
    id: 'cohere',
    name: 'Cohere',
    languageModels: [
      { id: 'command-r-plus', name: 'Command R Plus', description: 'Enhanced Command R model' },
      {
        id: 'command-r-plus-08-2024',
        name: 'Command R Plus (Aug 2024)',
        description: 'August 2024 Command R Plus',
      },
      { id: 'command-r', name: 'Command R', description: 'Base Command R model' },
      {
        id: 'command-r-08-2024',
        name: 'Command R (Aug 2024)',
        description: 'August 2024 Command R',
      },
      {
        id: 'command-r-03-2024',
        name: 'Command R (Mar 2024)',
        description: 'March 2024 Command R',
      },
      { id: 'command', name: 'Command', description: 'Base Command model' },
      { id: 'command-nightly', name: 'Command Nightly', description: 'Nightly Command build' },
      { id: 'command-light', name: 'Command Light', description: 'Lightweight Command model' },
      {
        id: 'command-light-nightly',
        name: 'Command Light Nightly',
        description: 'Nightly Command Light build',
      },
    ],
    textEmbeddingModels: [
      {
        id: 'embed-english-v3.0',
        name: 'Embed English v3.0',
        description: 'Latest English embedding model',
        dimensions: 1024,
      },
      {
        id: 'embed-multilingual-v3.0',
        name: 'Embed Multilingual v3.0',
        description: 'Latest multilingual embedding model',
        dimensions: 1024,
      },
      {
        id: 'embed-english-light-v3.0',
        name: 'Embed English Light v3.0',
        description: 'Lightweight English embedding model',
        dimensions: 384,
      },
      {
        id: 'embed-multilingual-light-v3.0',
        name: 'Embed Multilingual Light v3.0',
        description: 'Lightweight multilingual embedding model',
        dimensions: 384,
      },
      {
        id: 'embed-english-v2.0',
        name: 'Embed English v2.0',
        description: 'Previous English embedding model',
        dimensions: 1024,
      },
      {
        id: 'embed-english-light-v2.0',
        name: 'Embed English Light v2.0',
        description: 'Previous lightweight English model',
        dimensions: 384,
      },
      {
        id: 'embed-multilingual-v2.0',
        name: 'Embed Multilingual v2.0',
        description: 'Previous multilingual model',
        dimensions: 1024,
      },
    ],
    imageModels: [],
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    languageModels: [
      {
        id: 'accounts/fireworks/models/deepseek-v3',
        name: 'DeepSeek V3',
        description: 'DeepSeek V3 model',
      },
      {
        id: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        name: 'Llama 3.3 70B',
        description: 'Latest Llama 3 70B model',
      },
      {
        id: 'accounts/fireworks/models/llama-v3p2-3b-instruct',
        name: 'Llama 3.2 3B',
        description: 'Llama 3.2 3B model',
      },
      {
        id: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
        name: 'Llama 3.1 405B',
        description: 'Very large Llama 3.1 model',
      },
      {
        id: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
        name: 'Llama 3.1 8B',
        description: 'Base Llama 3.1 model',
      },
      {
        id: 'accounts/fireworks/models/mixtral-8x7b-instruct',
        name: 'Mixtral 8x7B',
        description: 'Mixtral instruction model',
      },
      {
        id: 'accounts/fireworks/models/mixtral-8x22b-instruct',
        name: 'Mixtral 8x22B',
        description: 'Large Mixtral model',
      },
      {
        id: 'accounts/fireworks/models/mixtral-8x7b-instruct-hf',
        name: 'Mixtral 8x7B HF',
        description: 'HuggingFace Mixtral model',
      },
      {
        id: 'accounts/fireworks/models/qwen2p5-coder-32b-instruct',
        name: 'Qwen 2.5 Coder 32B',
        description: 'Qwen coding model',
      },
      {
        id: 'accounts/fireworks/models/qwen2p5-72b-instruct',
        name: 'Qwen 2.5 72B',
        description: 'Large Qwen model',
      },
      {
        id: 'accounts/fireworks/models/qwen-qwq-32b-preview',
        name: 'QwQ 32B',
        description: 'QwQ preview model',
      },
      {
        id: 'accounts/fireworks/models/qwen2-vl-72b-instruct',
        name: 'Qwen 2 VL 72B',
        description: 'Vision-language Qwen model',
      },
      {
        id: 'accounts/fireworks/models/llama-v3p2-11b-vision-instruct',
        name: 'Llama 3.2 11B Vision',
        description: 'Vision-capable Llama model',
      },
      { id: 'accounts/fireworks/models/yi-large', name: 'Yi Large', description: 'Large Yi model' },
      {
        id: 'accounts/fireworks/models/llama-v3-8b-instruct',
        name: 'Llama 3 8B',
        description: 'Base Llama 3 model',
      },
      {
        id: 'accounts/fireworks/models/llama-v2-34b-code',
        name: 'Llama 2 34B Code',
        description: 'Code generation model',
      },
    ],
    textEmbeddingModels: [
      {
        id: 'nomic-ai/nomic-embed-text-v1.5',
        name: 'Nomic Embed',
        description: 'Nomic text embedding model',
        dimensions: 768,
      },
    ],
    imageModels: [
      {
        id: 'accounts/fireworks/models/flux-1-dev-fp8',
        name: 'Flux Dev',
        description: 'Development Flux model',
      },
      {
        id: 'accounts/fireworks/models/flux-1-schnell-fp8',
        name: 'Flux Schnell',
        description: 'Fast Flux model',
      },
      {
        id: 'accounts/fireworks/models/playground-v2-5-1024px-aesthetic',
        name: 'Playground v2.5',
        description: 'Aesthetic image model',
      },
      {
        id: 'accounts/fireworks/models/japanese-stable-diffusion-xl',
        name: 'Japanese SDXL',
        description: 'Japanese-style model',
      },
      {
        id: 'accounts/fireworks/models/playground-v2-1024px-aesthetic',
        name: 'Playground v2',
        description: 'Previous playground model',
      },
      {
        id: 'accounts/fireworks/models/SSD-1B',
        name: 'SSD-1B',
        description: 'Specialized diffusion model',
      },
      {
        id: 'accounts/fireworks/models/stable-diffusion-xl-1024-v1-0',
        name: 'SDXL',
        description: 'Stable Diffusion XL model',
      },
    ],
  },
  {
    id: 'deepinfra',
    name: 'Deep Infra',
    languageModels: [
      {
        id: 'meta-llama/Llama-3.3-70B-Instruct',
        name: 'Llama 3.3 70B',
        description: 'Latest Llama 3 70B model',
      },
      {
        id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        name: 'Llama 3.3 70B Turbo',
        description: 'Fast Llama 3.3 70B model',
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
        name: 'Llama 3.1 70B',
        description: 'Llama 3.1 70B model',
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
        name: 'Llama 3.1 8B',
        description: 'Llama 3.1 8B model',
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-405B-Instruct',
        name: 'Llama 3.1 405B',
        description: 'Very large Llama 3.1 model',
      },
      { id: 'Qwen/QwQ-32B-Preview', name: 'QwQ 32B', description: 'QwQ preview model' },
      {
        id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        name: 'Llama 3.1 8B Turbo',
        description: 'Fast Llama 3.1 8B model',
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        name: 'Llama 3.1 70B Turbo',
        description: 'Fast Llama 3.1 70B model',
      },
      {
        id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        name: 'Qwen 2.5 Coder 32B',
        description: 'Qwen coding model',
      },
      {
        id: 'nvidia/Llama-3.1-Nemotron-70B-Instruct',
        name: 'Nemotron 70B',
        description: 'NVIDIA Nemotron model',
      },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', description: 'Large Qwen model' },
      {
        id: 'meta-llama/Llama-3.2-90B-Vision-Instruct',
        name: 'Llama 3.2 90B Vision',
        description: 'Vision-capable large model',
      },
      {
        id: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
        name: 'Llama 3.2 11B Vision',
        description: 'Vision-capable medium model',
      },
      {
        id: 'microsoft/WizardLM-2-8x22B',
        name: 'WizardLM 2',
        description: 'Microsoft WizardLM model',
      },
      { id: '01-ai/Yi-34B-Chat', name: 'Yi 34B', description: 'Yi chat model' },
      {
        id: 'Austism/chronos-hermes-13b-v2',
        name: 'Chronos Hermes',
        description: 'Chronos Hermes model',
      },
      { id: 'Gryphe/MythoMax-L2-13b', name: 'MythoMax L2', description: 'MythoMax model' },
      {
        id: 'Gryphe/MythoMax-L2-13b-turbo',
        name: 'MythoMax L2 Turbo',
        description: 'Fast MythoMax model',
      },
      {
        id: 'HuggingFaceH4/zephyr-orpo-141b-A35b-v0.1',
        name: 'Zephyr ORPO',
        description: 'Zephyr model',
      },
      {
        id: 'KoboldAI/LLaMA2-13B-Tiefighter',
        name: 'Tiefighter 13B',
        description: 'Tiefighter model',
      },
      { id: 'NousResearch/Hermes-3-Llama-3.1-405B', name: 'Hermes 3', description: 'Hermes model' },
      {
        id: 'Phind/Phind-CodeLlama-34B-v2',
        name: 'Phind CodeLlama',
        description: 'Phind code model',
      },
      { id: 'Qwen/Qwen2-72B-Instruct', name: 'Qwen 2 72B', description: 'Large Qwen 2 model' },
      { id: 'Qwen/Qwen2-7B-Instruct', name: 'Qwen 2 7B', description: 'Base Qwen 2 model' },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B', description: 'Base Qwen 2.5 model' },
      {
        id: 'Qwen/Qwen2.5-Coder-7B',
        name: 'Qwen 2.5 Coder 7B',
        description: 'Small Qwen coding model',
      },
      { id: 'Sao10K/L3-70B-Euryale-v2.1', name: 'Euryale v2.1', description: 'Euryale model' },
      { id: 'Sao10K/L3-8B-Lunaris-v1', name: 'Lunaris v1', description: 'Lunaris model' },
      {
        id: 'Sao10K/L3.1-70B-Euryale-v2.2',
        name: 'Euryale v2.2',
        description: 'Updated Euryale model',
      },
      { id: 'bigcode/starcoder2-15b', name: 'StarCoder 2', description: 'StarCoder model' },
      {
        id: 'bigcode/starcoder2-15b-instruct-v0.1',
        name: 'StarCoder 2 Instruct',
        description: 'StarCoder instruction model',
      },
      {
        id: 'codellama/CodeLlama-34b-Instruct-hf',
        name: 'CodeLlama 34B',
        description: 'Large code model',
      },
      {
        id: 'codellama/CodeLlama-70b-Instruct-hf',
        name: 'CodeLlama 70B',
        description: 'Very large code model',
      },
      {
        id: 'cognitivecomputations/dolphin-2.6-mixtral-8x7b',
        name: 'Dolphin 2.6',
        description: 'Dolphin Mixtral model',
      },
      {
        id: 'cognitivecomputations/dolphin-2.9.1-llama-3-70b',
        name: 'Dolphin 2.9.1',
        description: 'Dolphin Llama model',
      },
      { id: 'databricks/dbrx-instruct', name: 'DBRX', description: 'Databricks model' },
      { id: 'deepinfra/airoboros-70b', name: 'Airoboros 70B', description: 'Airoboros model' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: 'Latest DeepSeek model' },
      { id: 'google/codegemma-7b-it', name: 'CodeGemma 7B', description: 'Google code model' },
      { id: 'google/gemma-1.1-7b-it', name: 'Gemma 1.1 7B', description: 'Google Gemma model' },
      { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', description: 'Large Gemma model' },
      { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', description: 'Medium Gemma model' },
      { id: 'lizpreciatior/lzlv_70b_fp16_hf', name: 'LZLV 70B', description: 'LZLV model' },
      {
        id: 'mattshumer/Reflection-Llama-3.1-70B',
        name: 'Reflection',
        description: 'Reflection model',
      },
      {
        id: 'meta-llama/Llama-2-13b-chat-hf',
        name: 'Llama 2 13B',
        description: 'Llama 2 chat model',
      },
      {
        id: 'meta-llama/Llama-2-70b-chat-hf',
        name: 'Llama 2 70B',
        description: 'Large Llama 2 chat model',
      },
      {
        id: 'meta-llama/Llama-2-7b-chat-hf',
        name: 'Llama 2 7B',
        description: 'Base Llama 2 chat model',
      },
      {
        id: 'meta-llama/Llama-3.2-1B-Instruct',
        name: 'Llama 3.2 1B',
        description: 'Small Llama 3.2 model',
      },
      {
        id: 'meta-llama/Llama-3.2-3B-Instruct',
        name: 'Llama 3.2 3B',
        description: 'Compact Llama 3.2 model',
      },
      {
        id: 'meta-llama/Meta-Llama-3-70B-Instruct',
        name: 'Llama 3 70B',
        description: 'Large Llama 3 model',
      },
      {
        id: 'meta-llama/Meta-Llama-3-8B-Instruct',
        name: 'Llama 3 8B',
        description: 'Base Llama 3 model',
      },
      {
        id: 'microsoft/Phi-3-medium-4k-instruct',
        name: 'Phi-3 Medium',
        description: 'Microsoft Phi model',
      },
      { id: 'microsoft/WizardLM-2-7B', name: 'WizardLM 2 7B', description: 'Base WizardLM model' },
      {
        id: 'mistralai/Mistral-7B-Instruct-v0.1',
        name: 'Mistral 7B v0.1',
        description: 'First Mistral version',
      },
      {
        id: 'mistralai/Mistral-7B-Instruct-v0.2',
        name: 'Mistral 7B v0.2',
        description: 'Second Mistral version',
      },
      {
        id: 'mistralai/Mistral-7B-Instruct-v0.3',
        name: 'Mistral 7B v0.3',
        description: 'Third Mistral version',
      },
      {
        id: 'mistralai/Mistral-Nemo-Instruct-2407',
        name: 'Mistral Nemo',
        description: 'Nemo instruction model',
      },
      {
        id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
        name: 'Mixtral 8x22B',
        description: 'Large Mixtral model',
      },
      {
        id: 'mistralai/Mixtral-8x22B-v0.1',
        name: 'Mixtral 8x22B Base',
        description: 'Base large Mixtral model',
      },
      {
        id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        name: 'Mixtral 8x7B',
        description: 'Mixtral instruction model',
      },
      {
        id: 'nvidia/Nemotron-4-340B-Instruct',
        name: 'Nemotron 340B',
        description: 'Very large Nemotron model',
      },
      { id: 'openbmb/MiniCPM-Llama3-V-2_5', name: 'MiniCPM', description: 'MiniCPM model' },
      { id: 'openchat/openchat-3.6-8b', name: 'OpenChat 3.6', description: 'OpenChat model' },
      { id: 'openchat/openchat_3.5', name: 'OpenChat 3.5', description: 'Previous OpenChat model' },
    ],
    textEmbeddingModels: [
      {
        id: 'BAAI/bge-base-en-v1.5',
        name: 'BGE Base English',
        description: 'Base English BGE model',
        dimensions: 768,
      },
      {
        id: 'BAAI/bge-large-en-v1.5',
        name: 'BGE Large English',
        description: 'Large English BGE model',
        dimensions: 1024,
      },
      { id: 'BAAI/bge-m3', name: 'BGE M3', description: 'M3 BGE model', dimensions: 1024 },
      { id: 'intfloat/e5-base-v2', name: 'E5 Base', description: 'Base E5 model', dimensions: 768 },
      {
        id: 'intfloat/e5-large-v2',
        name: 'E5 Large',
        description: 'Large E5 model',
        dimensions: 1024,
      },
      {
        id: 'intfloat/multilingual-e5-large',
        name: 'E5 Large Multilingual',
        description: 'Multilingual E5 model',
        dimensions: 1024,
      },
      {
        id: 'sentence-transformers/all-MiniLM-L12-v2',
        name: 'MiniLM L12',
        description: 'MiniLM model',
        dimensions: 384,
      },
      {
        id: 'sentence-transformers/all-MiniLM-L6-v2',
        name: 'MiniLM L6',
        description: 'Small MiniLM model',
        dimensions: 384,
      },
      {
        id: 'sentence-transformers/all-mpnet-base-v2',
        name: 'MPNet Base',
        description: 'MPNet model',
        dimensions: 768,
      },
      {
        id: 'sentence-transformers/clip-ViT-B-32',
        name: 'CLIP ViT B/32',
        description: 'CLIP vision model',
        dimensions: 512,
      },
      {
        id: 'sentence-transformers/clip-ViT-B-32-multilingual-v1',
        name: 'CLIP Multilingual',
        description: 'Multilingual CLIP model',
        dimensions: 512,
      },
      {
        id: 'sentence-transformers/multi-qa-mpnet-base-dot-v1',
        name: 'QA MPNet',
        description: 'QA-focused MPNet',
        dimensions: 768,
      },
      {
        id: 'sentence-transformers/paraphrase-MiniLM-L6-v2',
        name: 'Paraphrase MiniLM',
        description: 'Paraphrase model',
        dimensions: 384,
      },
      {
        id: 'shibing624/text2vec-base-chinese',
        name: 'Text2Vec Chinese',
        description: 'Chinese embedding model',
        dimensions: 768,
      },
      { id: 'thenlper/gte-base', name: 'GTE Base', description: 'Base GTE model', dimensions: 768 },
      {
        id: 'thenlper/gte-large',
        name: 'GTE Large',
        description: 'Large GTE model',
        dimensions: 1024,
      },
    ],
    imageModels: [
      { id: 'stabilityai/sd3.5', name: 'SD 3.5', description: 'Stable Diffusion 3.5' },
      {
        id: 'black-forest-labs/FLUX-1.1-pro',
        name: 'FLUX 1.1 Pro',
        description: 'Professional FLUX model',
      },
      {
        id: 'black-forest-labs/FLUX-1-schnell',
        name: 'FLUX Schnell',
        description: 'Fast FLUX model',
      },
      {
        id: 'black-forest-labs/FLUX-1-dev',
        name: 'FLUX Dev',
        description: 'Development FLUX model',
      },
      { id: 'black-forest-labs/FLUX-pro', name: 'FLUX Pro', description: 'Pro FLUX model' },
      { id: 'stabilityai/sd3.5-medium', name: 'SD 3.5 Medium', description: 'Medium SD 3.5 model' },
      { id: 'stabilityai/sdxl-turbo', name: 'SDXL Turbo', description: 'Fast SDXL model' },
    ],
  },
  {
    id: 'cerebras',
    name: 'Cerebras AI',
    languageModels: [
      { id: 'llama3.1-8b', name: 'Llama 3.1 8B', description: 'Llama 3.1 8B model' },
      { id: 'llama3.1-70b', name: 'Llama 3.1 70B', description: 'Llama 3.1 70B model' },
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', description: 'Latest Llama 3 70B model' },
    ],
    textEmbeddingModels: [],
    imageModels: [],
  },
  {
    id: 'groq',
    name: 'Groq',
    languageModels: [
      {
        id: 'deepseek-r1-distill-llama-70b',
        name: 'DeepSeek R1',
        description: 'DeepSeek distilled model',
      },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Gemma 2 9B instruction model' },
      { id: 'gemma-7b-it', name: 'Gemma 7B', description: 'Gemma 7B instruction model' },
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        description: 'Versatile Llama 3.3 70B model',
      },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Fast Llama 3.1 8B model' },
      { id: 'llama-guard-3-8b', name: 'Llama Guard', description: 'Safety model' },
      { id: 'llama3-70b-8192', name: 'Llama 3 70B', description: 'Large context Llama 3 model' },
      { id: 'llama3-8b-8192', name: 'Llama 3 8B', description: 'Large context base model' },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'Mixtral model with 32K context',
      },
    ],
    textEmbeddingModels: [],
    imageModels: [],
  },
  {
    id: 'replicate',
    name: 'Replicate',
    languageModels: [],
    textEmbeddingModels: [],
    imageModels: [
      {
        id: 'black-forest-labs/flux-1.1-pro',
        name: 'FLUX 1.1 Pro',
        description: 'Professional FLUX model',
      },
      {
        id: 'black-forest-labs/flux-1.1-pro-ultra',
        name: 'FLUX 1.1 Pro Ultra',
        description: 'Ultra high quality FLUX model',
      },
      { id: 'black-forest-labs/flux-dev', name: 'FLUX Dev', description: 'Development FLUX model' },
      { id: 'black-forest-labs/flux-pro', name: 'FLUX Pro', description: 'Pro FLUX model' },
      {
        id: 'black-forest-labs/flux-schnell',
        name: 'FLUX Schnell',
        description: 'Fast FLUX model',
      },
      {
        id: 'bytedance/sdxl-lightning-4step',
        name: 'SDXL Lightning',
        description: '4-step SDXL model',
      },
      { id: 'fofr/aura-flow', name: 'Aura Flow', description: 'Aura Flow model' },
      { id: 'fofr/latent-consistency-model', name: 'LCM', description: 'Latent Consistency model' },
      {
        id: 'fofr/realvisxl-v3-multi-controlnet-lora',
        name: 'RealVisXL v3',
        description: 'RealVis with ControlNet',
      },
      { id: 'fofr/sdxl-emoji', name: 'SDXL Emoji', description: 'Emoji generation model' },
      {
        id: 'fofr/sdxl-multi-controlnet-lora',
        name: 'SDXL ControlNet',
        description: 'SDXL with ControlNet',
      },
      { id: 'ideogram-ai/ideogram-v2', name: 'Ideogram v2', description: 'Ideogram model' },
      {
        id: 'ideogram-ai/ideogram-v2-turbo',
        name: 'Ideogram v2 Turbo',
        description: 'Fast Ideogram model',
      },
      {
        id: 'lucataco/dreamshaper-xl-turbo',
        name: 'DreamShaper XL',
        description: 'DreamShaper model',
      },
      { id: 'lucataco/open-dalle-v1.1', name: 'Open DALL·E', description: 'Open source DALL·E' },
      { id: 'lucataco/realvisxl-v2.0', name: 'RealVisXL v2', description: 'RealVis model' },
      { id: 'lucataco/realvisxl2-lcm', name: 'RealVisXL2 LCM', description: 'RealVis with LCM' },
      { id: 'luma/photon', name: 'Photon', description: 'Photon model' },
      { id: 'luma/photon-flash', name: 'Photon Flash', description: 'Fast Photon model' },
      { id: 'nvidia/sana', name: 'SANA', description: 'NVIDIA SANA model' },
      {
        id: 'playgroundai/playground-v2.5-1024px-aesthetic',
        name: 'Playground v2.5',
        description: 'Aesthetic image model',
      },
      { id: 'recraft-ai/recraft-v3', name: 'Recraft v3', description: 'Recraft model' },
      {
        id: 'recraft-ai/recraft-v3-svg',
        name: 'Recraft v3 SVG',
        description: 'SVG generation model',
      },
      {
        id: 'stability-ai/stable-diffusion-3.5-large',
        name: 'SD 3.5 Large',
        description: 'Large SD 3.5 model',
      },
      {
        id: 'stability-ai/stable-diffusion-3.5-large-turbo',
        name: 'SD 3.5 Large Turbo',
        description: 'Fast large SD 3.5 model',
      },
      {
        id: 'stability-ai/stable-diffusion-3.5-medium',
        name: 'SD 3.5 Medium',
        description: 'Medium SD 3.5 model',
      },
      {
        id: 'tstramer/material-diffusion',
        name: 'Material Diffusion',
        description: 'Material generation model',
      },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    languageModels: [
      { id: 'sonar-pro', name: 'Sonar Pro', description: 'Advanced Sonar model' },
      { id: 'sonar', name: 'Sonar', description: 'Base Sonar model' },
    ],
    textEmbeddingModels: [],
    imageModels: [],
  },
  {
    id: 'luma',
    name: 'Luma',
    languageModels: [],
    textEmbeddingModels: [],
    imageModels: [
      { id: 'photon-1', name: 'Photon', description: 'Base Photon model' },
      { id: 'photon-flash-1', name: 'Photon Flash', description: 'Fast Photon model' },
    ],
  },
] as const

export const languageModelInfos = providerInfos.flatMap(
  (provider) =>
    provider.languageModels?.map((model) => ({
      ...model,
      id: modelFullId(provider.id, model.id),
    })) ?? [],
)

export const textEmbeddingModelInfos = providerInfos.flatMap(
  (provider) =>
    provider.textEmbeddingModels?.map((model) => ({
      ...model,
      id: modelFullId(provider.id, model.id),
    })) ?? [],
)

export const imageModelInfos = providerInfos.flatMap(
  (provider) =>
    provider.imageModels?.map((model) => ({
      ...model,
      id: modelFullId(provider.id, model.id),
    })) ?? [],
)

export function getLanguageModelInfo(fullId: string) {
  return languageModelInfos.find((model) => model.id === fullId)
}

export function getTextEmbeddingModelInfo(fullId: string) {
  return textEmbeddingModelInfos.find((model) => model.id === fullId)
}

export function getImageModelInfo(fullId: string) {
  return imageModelInfos.find((model) => model.id === fullId)
}

export function modelFullId(providerId: string, modelId: string) {
  return `${providerId}::${modelId}`
}

export function splitModelFullId(fullId: string) {
  const [providerId, modelId] = fullId.split('::')
  return { providerId, modelId } as { providerId: ProviderId; modelId: string }
}

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
}
