import type { ProviderInfo } from '../types'

/**
 * Google Cloud Vertex AI provider information including all available models
 */
const vertexProvider: ProviderInfo = {
  id: 'vertex',
  name: 'Google Cloud Vertex AI',
  icon: 'vertex_ai.svg',
  description: 'Google Cloud Vertex AI platform for enterprise ML and AI services',
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
}

export default vertexProvider
