import type { ProviderInfo } from '../types'

/**
 * Amazon Bedrock provider information including all available models
 */
const bedrockProvider: ProviderInfo = {
  id: 'bedrock',
  name: 'Amazon Bedrock',
  icon: 'bedrock.svg',
  description: 'Amazon Bedrock AI service offering a variety of foundation models',
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
}

export default bedrockProvider 
