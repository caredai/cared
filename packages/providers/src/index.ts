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
  textEmbeddingModels?: ModelInfo[]
  imageModels?: ModelInfo[]
}

export interface ModelInfo {
  id: string
  name: string
  description: string
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
      },
      {
        id: 'text-embedding-3-large',
        name: 'Text Embedding 3 Large',
        description: 'Most capable embedding model',
      },
      {
        id: 'text-embedding-ada-002',
        name: 'Text Embedding Ada 002',
        description: 'Legacy embedding model',
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
      },
      {
        id: 'amazon.titan-embed-text-v2:0',
        name: 'Titan Embed Text V2',
        description: 'Enhanced Titan embedding model',
      },
      {
        id: 'cohere.embed-english-v3',
        name: 'Cohere Embed English',
        description: 'English embedding model',
      },
      {
        id: 'cohere.embed-multilingual-v3',
        name: 'Cohere Embed Multilingual',
        description: 'Multilingual embedding model',
      },
    ],
  },
  {
    id: 'google',
    name: 'Google AI',
    languageModels: [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash Exp',
        description: 'Experimental flash model',
      },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast Gemini 1.5 model' },
      {
        id: 'gemini-1.5-flash-latest',
        name: 'Gemini 1.5 Flash Latest',
        description: 'Latest flash model',
      },
      {
        id: 'gemini-1.5-pro-latest',
        name: 'Gemini 1.5 Pro Latest',
        description: 'Latest pro model',
      },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Pro version' },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Original pro model' },
    ],
    textEmbeddingModels: [
      {
        id: 'text-embedding-004',
        name: 'Text Embedding 004',
        description: 'Latest embedding model',
      },
    ],
  },
  {
    id: 'vertex',
    name: 'Google Cloud Vertex AI',
    languageModels: [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash Exp',
        description: 'Experimental flash model',
      },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast Gemini 1.5 model' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Pro version' },
      { id: 'gemini-1.0-pro-001', name: 'Gemini 1.0 Pro 001', description: 'Original pro model' },
      {
        id: 'gemini-1.0-pro-vision-001',
        name: 'Gemini 1.0 Pro Vision',
        description: 'Vision-capable model',
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
      { id: 'mistral-embed', name: 'Mistral Embed', description: 'Mistral embedding model' },
    ],
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
  },
  {
    id: 'togetherai',
    name: 'Together AI',
    languageModels: [],
    textEmbeddingModels: [
      {
        id: 'togethercomputer/m2-bert-80M-2k-retrieval',
        name: 'M2 BERT 2K',
        description: '2K context BERT model',
      },
      {
        id: 'togethercomputer/m2-bert-80M-32k-retrieval',
        name: 'M2 BERT 32K',
        description: '32K context BERT model',
      },
      {
        id: 'togethercomputer/m2-bert-80M-8k-retrieval',
        name: 'M2 BERT 8K',
        description: '8K context BERT model',
      },
      { id: 'WhereIsAI/UAE-Large-V1', name: 'UAE Large', description: 'Large UAE model' },
      {
        id: 'BAAI/bge-large-en-v1.5',
        name: 'BGE Large English',
        description: 'Large English BGE model',
      },
      {
        id: 'BAAI/bge-base-en-v1.5',
        name: 'BGE Base English',
        description: 'Base English BGE model',
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
      },
      {
        id: 'embed-multilingual-v3.0',
        name: 'Embed Multilingual v3.0',
        description: 'Latest multilingual embedding model',
      },
      {
        id: 'embed-english-light-v3.0',
        name: 'Embed English Light v3.0',
        description: 'Lightweight English embedding model',
      },
      {
        id: 'embed-multilingual-light-v3.0',
        name: 'Embed Multilingual Light v3.0',
        description: 'Lightweight multilingual embedding model',
      },
    ],
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
        id: 'accounts/fireworks/models/qwen2p5-72b-instruct',
        name: 'Qwen 2.5 72B',
        description: 'Large Qwen model',
      },
    ],
    textEmbeddingModels: [
      {
        id: 'nomic-ai/nomic-embed-text-v1.5',
        name: 'Nomic Embed',
        description: 'Nomic text embedding model',
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
        id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        name: 'Mixtral 8x7B',
        description: 'Mixtral instruction model',
      },
      {
        id: 'mistralai/Mistral-7B-Instruct-v0.1',
        name: 'Mistral 7B',
        description: 'Mistral instruction model',
      },
    ],
    textEmbeddingModels: [
      {
        id: 'BAAI/bge-large-en-v1.5',
        name: 'BGE Large English',
        description: 'Large English BGE model',
      },
      {
        id: 'BAAI/bge-base-en-v1.5',
        name: 'BGE Base English',
        description: 'Base English BGE model',
      },
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
  },
  {
    id: 'groq',
    name: 'Groq',
    languageModels: [
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Gemma 2 9B instruction model' },
      { id: 'gemma-7b-it', name: 'Gemma 7B', description: 'Gemma 7B instruction model' },
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        description: 'Versatile Llama 3.3 70B model',
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'Mixtral model with 32K context',
      },
    ],
  },
  {
    id: 'replicate',
    name: 'Replicate',
    languageModels: [],
    textEmbeddingModels: [],
    imageModels: [
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
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    languageModels: [
      { id: 'sonar-pro', name: 'Sonar Pro', description: 'Advanced Sonar model' },
      { id: 'sonar', name: 'Sonar', description: 'Base Sonar model' },
    ],
  },
  {
    id: 'luma',
    name: 'Luma',
    imageModels: [
      { id: 'photon-1', name: 'Photon', description: 'Base Photon model' },
      { id: 'photon-flash-1', name: 'Photon Flash', description: 'Fast Photon model' },
    ],
  },
] as const

export const modelInfos = providerInfos.flatMap(
  (provider) =>
    provider.languageModels?.map((model) => ({
      ...model,
      id: modelFullId(provider.id, model.id),
    })) ?? [],
)

export function modelFullId(providerId: string, modelId: string) {
  return `${providerId}::${modelId}`
}

export function splitModelFullId(fullId: string) {
  let [providerId, modelId] = fullId.split('::')
  if (!modelId) {
    modelId = providerId
    providerId = undefined
  }
  return { providerId, modelId }
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
