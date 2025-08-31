import { Decimal } from 'decimal.js'

import { SuperJSON } from '@cared/shared'

import type {
  GenerationDetailsByType,
  GenerationDetails,
  ModelInfos,
  ModelType,
} from './types'
import type {
  EmbeddingModelV2,
  ImageModelV2CallOptions,
  LanguageModelV2CallOptions,
  SpeechModelV2CallOptions,
  TranscriptionModelV2CallOptions,
} from '@ai-sdk/provider'

export function computeGenerationCost<T extends ModelType, K extends `${T}Models`>(
  type: T,
  model: NonNullable<ModelInfos[K]>[number],
  details: GenerationDetailsByType<GenerationDetails, T>,
): Decimal | undefined {
  const computeCost = () => {
    switch (type) {
      case 'language':
        return computeLanguageCost(model as any, details as any)
      case 'image':
        return computeImageCost(model as any, details as any)
      case 'speech':
        return computeSpeechCost(model as any, details as any)
      case 'transcription':
        return computeTranscriptionCost(model as any, details as any)
      case 'textEmbedding':
        return computeTextEmbeddingCost(model as any, details as any)
    }
  }

  return (
    computeCost()
      // divided by M
      ?.div(Decimal.pow(10, 6))
      // rounded up to 10 decimal places
      .toDecimalPlaces(10, Decimal.ROUND_CEIL)
  )
}

export type ModelCallOptions =
  | ({
      modelType: 'language'
    } & LanguageModelV2CallOptions)
  | ({
      modelType: 'image'
    } & ImageModelV2CallOptions)
  | ({
      modelType: 'speech'
    } & SpeechModelV2CallOptions)
  | ({
      modelType: 'transcription'
    } & TranscriptionModelV2CallOptions)
  | ({
      modelType: 'textEmbedding'
    } & Parameters<EmbeddingModelV2<number>['doEmbed']>[0])

export function estimateGenerationCost<T extends ModelType, K extends `${T}Models`>(
  type: T,
  model: NonNullable<ModelInfos[K]>[number],
  callOptions: GenerationDetailsByType<ModelCallOptions, T>,
): Decimal | undefined {
  if (!model.chargeable) {
    return
  }

  // TODO
  switch (type) {
    case 'language':
      return estimateLanguageCost(model as any, callOptions as any)
    case 'image':
      return undefined
    case 'speech':
      return undefined
    case 'transcription':
      return undefined
    case 'textEmbedding':
      return undefined
  }
}

function estimateLanguageCost(
  model: NonNullable<ModelInfos['languageModels']>[number],
  callOptions: LanguageModelV2CallOptions,
) {
  // TODO: count tokens properly
  const inputTokens = SuperJSON.stringify(callOptions.prompt).length * 2 + 100
  return new Decimal(model.inputTokenPrice ?? 0).times(inputTokens)
}

function computeLanguageCost(
  model: NonNullable<ModelInfos['languageModels']>[number],
  details: GenerationDetailsByType<GenerationDetails, 'language'>,
): Decimal | undefined {
  if (!model.chargeable) {
    return
  }

  const usage = details.usage

  const inputCost = new Decimal(model.inputTokenPrice ?? 0)
    .times((usage.inputTokens ?? 0) - (usage.cachedInputTokens ?? 0))
    .round()
    .clamp(0, Infinity)
  const outputCost = new Decimal(model.outputTokenPrice ?? 0).times(usage.outputTokens ?? 0)
  const cachedInputCost = new Decimal(model.cachedInputTokenPrice ?? 0).times(
    usage.cachedInputTokens ?? 0,
  )
  let cacheInputCost = new Decimal(0)
  for (const [key, value] of Object.entries(Object.values(details.providerMetadata ?? {}))) {
    // For anthropic
    if (key === 'cacheCreationInputTokens' && typeof value === 'number') {
      let price: string | number = 0
      if (typeof model.cachedInputTokenPrice === 'string') {
        price = model.cachedInputTokenPrice
      } else if (Array.isArray(model.cacheInputTokenPrice)) {
        // TODO
        price = Decimal.max(...model.cacheInputTokenPrice.map(([, price]) => price)).toString()
      }

      cacheInputCost = new Decimal(price).times(value)
      break
    }
  }

  return inputCost.plus(outputCost).plus(cachedInputCost).plus(cacheInputCost)
}

function computeImageCost(
  model: NonNullable<ModelInfos['imageModels']>[number],
  _details: GenerationDetailsByType<GenerationDetails, 'image'>,
): Decimal | undefined {
  if (!model.chargeable) {
    return
  }
}

function computeSpeechCost(
  model: NonNullable<ModelInfos['speechModels']>[number],
  _details: GenerationDetailsByType<GenerationDetails, 'speech'>,
): Decimal | undefined {
  if (!model.chargeable) {
    return
  }
}

function computeTranscriptionCost(
  model: NonNullable<ModelInfos['transcriptionModels']>[number],
  _details: GenerationDetailsByType<GenerationDetails, 'transcription'>,
): Decimal | undefined {
  if (!model.chargeable) {
    return
  }
  return
}

function computeTextEmbeddingCost(
  model: NonNullable<ModelInfos['textEmbeddingModels']>[number],
  _details: GenerationDetailsByType<GenerationDetails, 'textEmbedding'>,
): Decimal | undefined {
  if (!model.chargeable) {
    return
  }
}
