import type { BaseProviderInfo } from './types'

export function getBaseProviderInfos(): BaseProviderInfo[] {
  return [
    {
      id: 'openrouter',
      name: 'OpenRouter',
      icon: 'openrouter.svg',
      description: 'OpenRouter API gateway providing access to various AI models',
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
    },
    {
      id: 'deepinfra',
      name: 'DeepInfra',
      icon: 'deepinfra.png',
      description:
        'DeepInfra platform offering a variety of open source models with optimized inference',
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
    },
    {
      id: 'replicate',
      name: 'Replicate',
      icon: 'replicate.svg',
      description: 'Replicate platform offering a wide variety of open source models',
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
  ]
}
