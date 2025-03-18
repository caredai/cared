import type { ProviderInfo } from '../types'

/**
 * OpenAI provider information including all available models
 */
const openaiProvider: ProviderInfo = {
  id: 'openai',
  name: 'OpenAI',
  icon: 'openai.svg',
  description: 'OpenAI API services including GPT models, embeddings and DALL·E',
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
}

export default openaiProvider
