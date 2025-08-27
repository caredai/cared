import type { BaseProviderInfo, ExtendedBaseProviderInfo } from './types'

export function getExtendedBaseProviderInfos(): ExtendedBaseProviderInfo[] {
  return [
    {
      id: 'openrouter',
      name: 'OpenRouter',
      icon: 'openrouter.svg',
      description: 'OpenRouter API gateway providing access to various AI models',
      isGateway: true,
      modelSeparator: splitModelIdByFirstSeparator,
    },
    {
      id: 'openai',
      name: 'OpenAI',
      icon: 'openai.svg',
      description: 'OpenAI API services including GPT models, embeddings and DALL·E',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      icon: 'anthropic.svg',
      description: 'Anthropic API services including Claude language models',
    },
    {
      id: 'google',
      name: 'Google AI',
      icon: 'gemini.svg',
      description: 'Google AI services including Gemini language models and embeddings',
    },
    {
      id: 'vertex',
      name: 'Google Cloud Vertex AI',
      icon: 'vertex_ai.svg',
      description: 'Google Cloud Vertex AI platform for enterprise ML and AI services',
      isGateway: true,
    },
    {
      id: 'azure',
      name: 'Azure OpenAI Service',
      icon: 'azure_openai.svg',
      description: 'Microsoft Azure OpenAI Service for enterprise-grade AI deployments',
    },
    {
      id: 'bedrock',
      name: 'Amazon Bedrock',
      icon: 'bedrock.svg',
      description: 'Amazon Bedrock AI service offering a variety of foundation models',
      isGateway: true,
      modelSeparator: (modelPrefixedId: string) =>
        splitModelIdByFirstSeparator(modelPrefixedId, '.'),
    },
    {
      id: 'deepseek',
      name: 'DeepSeek AI',
      icon: 'deepseek.svg',
      description: 'DeepSeek AI language models for general purpose and specialized reasoning',
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      icon: 'mistralai.png',
      description:
        'Mistral AI language and embedding models including Mistral, Mixtral and Pixtral',
    },
    {
      id: 'xai',
      name: 'xAI',
      icon: 'x.svg',
      description: 'xAI Grok language models with general and vision capabilities',
    },
    {
      id: 'togetherai',
      name: 'Together AI',
      icon: 'togetherai.svg',
      description: 'Together AI platform offering a variety of open source and proprietary models',
      isGateway: true,
      modelSeparator: splitModelIdByFirstSeparator,
    },
    {
      id: 'cohere',
      name: 'Cohere',
      icon: 'cohere.svg',
      description: 'Cohere platform offering advanced language models for various applications',
    },
    {
      id: 'fireworks',
      name: 'Fireworks AI',
      icon: 'fireworks.svg',
      description: 'Fireworks AI platform offering optimized open source models',
      isGateway: true,
      modelSeparator: splitModelIdByLastSeparator,
    },
    {
      id: 'deepinfra',
      name: 'DeepInfra',
      icon: 'deepinfra.png',
      description:
        'DeepInfra platform offering a variety of open source models with optimized inference',
      isGateway: true,
      modelSeparator: splitModelIdByFirstSeparator,
    },
    {
      id: 'cerebras',
      name: 'Cerebras',
      icon: 'cerebras.png',
      description: 'Cerebras AI platform offering specialized language models',
    },
    {
      id: 'groq',
      name: 'Groq',
      icon: 'groq.svg',
      description: 'Groq platform offering ultra-fast inference for language models',
      isGateway: true,
      modelSeparator: splitModelIdByFirstSeparator,
    },
    {
      id: 'replicate',
      name: 'Replicate',
      icon: 'replicate.svg',
      description: 'Replicate platform offering a wide variety of open source models',
      isGateway: true,
      modelSeparator: splitModelIdByFirstSeparator,
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      icon: 'perplexity.png',
      description:
        'Perplexity AI platform offering specialized language models for search and information retrieval',
    },
    {
      id: 'luma',
      name: 'Luma AI',
      icon: 'luma.svg',
      description: 'Luma AI platform specializing in video generation and 3D content creation',
    },
    {
      id: 'vercel',
      name: 'Vercel v0',
      icon: 'v0.svg',
      description:
        'The v0 Model API is designed for building modern web applications. It supports text and image inputs, provides fast streaming responses, and is compatible with the OpenAI Chat Completions API format.',
    },
    {
      id: 'fal',
      name: 'Fal',
      icon: 'fal.svg',
      description:
        'Fal AI provides a generative media platform for developers with lightning-fast inference capabilities. Their platform offers optimized performance for running diffusion models, with speeds up to 4x faster than alternatives.',
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      icon: 'elevenlabs.svg',
      description:
        'The ElevenLabs provider contains language model support for the ElevenLabs transcription and speech generation APIs.',
    },
    {
      id: 'lmnt',
      name: 'LMNT',
      icon: 'lmnt.svg',
      description:
        "LMNT's text-to-speech and voice cloning API gives you the tools to build lifelike AI experiences",
    },
  ]
}

export function getBaseProviderInfos(): BaseProviderInfo[] {
  return getExtendedBaseProviderInfos().map(({ modelSeparator: _, ...baseInfo }) => baseInfo)
}

export function splitModelIdByFirstSeparator(modelPrefixedId: string, sep = '/') {
  const index = modelPrefixedId.indexOf(sep)
  const prefix = index >= 0 ? modelPrefixedId.slice(0, index) : ''
  const modelId = index >= 0 ? modelPrefixedId.slice(index + 1) : modelPrefixedId
  return { prefix, modelId }
}

export function splitModelIdByLastSeparator(modelPrefixedId: string, sep = '/') {
  const index = modelPrefixedId.lastIndexOf(sep)
  const prefix = index >= 0 ? modelPrefixedId.slice(0, index) : ''
  const modelId = index >= 0 ? modelPrefixedId.slice(index + 1) : modelPrefixedId
  return { prefix, modelId }
}
