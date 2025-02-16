import { modelFullId } from '.'

export const defaultModels = {
  app: {
    languageModel: modelFullId('deepseek', 'deepseek-chat'),
    embeddingModel: modelFullId('google-vertex', 'text-multilingual-embedding-002'),
    rerankModel: modelFullId('cohere', 'embed-multilingual-v3.0'),
  },
  dataset: {
    languageModel: modelFullId('deepseek', 'deepseek-chat'),
    embeddingModel: modelFullId('google-vertex', 'text-multilingual-embedding-002'),
    rerankModel: modelFullId('cohere', 'embed-multilingual-v3.0'),
  },
}
