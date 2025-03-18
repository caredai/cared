import type { ProviderInfo } from '../types'

/**
 * Google AI provider information including all available Gemini models
 */
const googleProvider: ProviderInfo = {
  id: 'google',
  name: 'Google AI',
  icon: 'gemini.svg',
  description: 'Google AI services including Gemini language models and embeddings',
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
}

export default googleProvider
