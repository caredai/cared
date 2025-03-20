import { modelFullId } from '.'

export const defaultModels = {
  app: {
    languageModel: modelFullId('openrouter', 'google/gemini-2.0-flash-lite-001'),
    // embeddingModel: modelFullId('google-vertex', 'text-multilingual-embedding-002'),
    embeddingModel: modelFullId('openai', 'text-embedding-3-small'),
    rerankModel: modelFullId('cohere', 'embed-multilingual-v3.0'),
    imageModel: modelFullId('openai', 'dall-e-3'),
  },
  dataset: {
    languageModel: modelFullId('openrouter', 'google/gemini-2.0-flash-lite-001'),
    // embeddingModel: modelFullId('google-vertex', 'text-multilingual-embedding-002'),
    embeddingModel: modelFullId('openai', 'text-embedding-3-small'),
    rerankModel: modelFullId('cohere', 'embed-multilingual-v3.0'),
  },
}
