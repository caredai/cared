import type { EmbeddingModelV1, ImageModelV1, LanguageModelV1 } from '@ai-sdk/provider'

import type { ModelType, ProviderId } from './types'
import { getProviderInfos } from './provider-infos'
import { providers } from './providers'

export * from './default'
export * from './types'
export * from './providers'
export * from './provider-infos'
export * from './openrouter'

export async function getLanguageModelInfos() {
  const providerInfos = await getProviderInfos()
  return providerInfos.flatMap(
    (provider) =>
      provider.languageModels?.map((model) => ({
        ...model,
        id: modelFullId(provider.id, model.id),
      })) ?? [],
  )
}

export async function getTextEmbeddingModelInfos() {
  const providerInfos = await getProviderInfos()
  return providerInfos.flatMap(
    (provider) =>
      provider.textEmbeddingModels?.map((model) => ({
        ...model,
        id: modelFullId(provider.id, model.id),
      })) ?? [],
  )
}

export async function getImageModelInfos() {
  const providerInfos = await getProviderInfos()
  return providerInfos.flatMap(
    (provider) =>
      provider.imageModels?.map((model) => ({
        ...model,
        id: modelFullId(provider.id, model.id),
      })) ?? [],
  )
}

export async function getLanguageModelInfo(fullId: string) {
  const languageModelInfos = await getLanguageModelInfos()
  return languageModelInfos.find((model) => model.id === fullId)
}

export async function getTextEmbeddingModelInfo(fullId: string) {
  const textEmbeddingModelInfos = await getTextEmbeddingModelInfos()
  return textEmbeddingModelInfos.find((model) => model.id === fullId)
}

export async function getImageModelInfo(fullId: string) {
  const imageModelInfos = await getImageModelInfos()
  return imageModelInfos.find((model) => model.id === fullId)
}

export function modelFullId(providerId: string, modelId: string) {
  return `${providerId}:${modelId}`
}

export function splitModelFullId(fullId: string) {
  const [providerId, modelId] = fullId.split(':', 2)
  return { providerId, modelId } as { providerId: ProviderId; modelId: string }
}

/**
 * Get model instance by model full ID and type
 * @param fullId Full model ID in format 'providerId:modelId'
 * @param modelType Type of model to get (language/text-embedding/image)
 * @returns Model instance of specified type, or undefined if not found
 */
export function getModel<T extends ModelType>(
  fullId: string,
  modelType: T,
): T extends 'language'
  ? LanguageModelV1 | undefined
  : T extends 'text-embedding'
    ? EmbeddingModelV1<string> | undefined
    : T extends 'image'
      ? ImageModelV1 | undefined
      : never {
  const { providerId, modelId } = splitModelFullId(fullId)
  const provider = providers[providerId]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!provider) {
    return undefined as any
  }
  if (modelType === 'language') {
    return provider.languageModel?.(modelId) as any
  } else if (modelType === 'text-embedding') {
    return provider.textEmbeddingModel?.(modelId) as any
  } else {
    return provider.image?.(modelId) as any
  }
}
