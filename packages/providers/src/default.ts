import {modelFullId} from '.'

export const defaultModels = {
  dataset: {
    languageModel: modelFullId('deepseek', 'deepseek-chat'),
    embeddingModel: modelFullId('google-vertex', 'text-multilingual-embedding-002'),
    rerankModel: modelFullId('cohere', 'embed-multilingual-v3.0')
  }
}
