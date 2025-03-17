import type { ProviderId } from './types'
import { getProviderInfos } from './provider-infos'

export * from './default'
export * from './types'
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
