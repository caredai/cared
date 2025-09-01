import assert from 'assert'
import { Decimal } from 'decimal.js'

import { SuperJSON } from '@cared/shared'

import type {
  BaseModelInfo,
  EmbeddingModelInfo,
  ImageGenerationDetails,
  ImageModelInfo,
  LanguageGenerationDetails,
  LanguageModelInfo,
  SpeechGenerationDetails,
  SpeechModelInfo,
  TextEmbeddingGenerationDetails,
  TranscriptionGenerationDetails,
  TranscriptionModelInfo,
  GenerationDetails,
  TypedModelInfo,
} from './types'
import type {
  EmbeddingModelV2,
  ImageModelV2CallOptions,
  LanguageModelV2CallOptions,
  SpeechModelV2CallOptions,
  TranscriptionModelV2CallOptions,
} from '@ai-sdk/provider'

export function isChargeable(model: BaseModelInfo) {
  return model.chargeable
}

export function isByokChargeable(model: TypedModelInfo) {
  if (isChargeable(model)) {
    return true
  }
  switch (model.type) {
    case 'language':
      return Boolean(model.inputTokenPrice || model.outputTokenPrice)
    case 'image':
      return Boolean(model.imageInputTokenPrice)
    case 'speech':
      return false
    case 'transcription':
      return false
    case 'textEmbedding':
      return false
  }
}

export function estimateGenerationCost(
  model: TypedModelInfo,
  callOptions: ModelCallOptions,
): Decimal | undefined {
  // TODO
  switch (model.type) {
    case 'language':
      assert(callOptions.type === 'language')
      return estimateLanguageCost(model, callOptions)
    case 'image':
      assert(callOptions.type === 'image')
      return undefined
    case 'speech':
      assert(callOptions.type === 'speech')
      return undefined
    case 'transcription':
      assert(callOptions.type === 'transcription')
      return undefined
    case 'textEmbedding':
      assert(callOptions.type === 'textEmbedding')
      return undefined
  }
}

function estimateLanguageCost(model: LanguageModelInfo, callOptions: LanguageModelV2CallOptions) {
  // TODO: count tokens properly
  const inputTokens = SuperJSON.stringify(callOptions.prompt).length * 2 + 100
  return new Decimal(model.inputTokenPrice ?? 0).times(inputTokens)
}

export function computeGenerationCost(
  model: TypedModelInfo,
  details: GenerationDetails,
): Decimal | undefined {
  const computeCost = () => {
    switch (model.type) {
      case 'language':
        assert(details.type === 'language')
        return computeLanguageCost(model, details)
      case 'image':
        assert(details.type === 'image')
        return computeImageCost(model, details)
      case 'speech':
        assert(details.type === 'speech')
        return computeSpeechCost(model, details)
      case 'transcription':
        assert(details.type === 'transcription')
        return computeTranscriptionCost(model, details)
      case 'textEmbedding':
        assert(details.type === 'textEmbedding')
        return computeTextEmbeddingCost(model, details)
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
      type: 'language'
    } & LanguageModelV2CallOptions)
  | ({
      type: 'image'
    } & ImageModelV2CallOptions)
  | ({
      type: 'speech'
    } & SpeechModelV2CallOptions)
  | ({
      type: 'transcription'
    } & TranscriptionModelV2CallOptions)
  | ({
      type: 'textEmbedding'
    } & Parameters<EmbeddingModelV2<number>['doEmbed']>[0])

function computeLanguageCost(
  model: LanguageModelInfo,
  details: LanguageGenerationDetails,
): Decimal | undefined {
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
  _model: ImageModelInfo,
  _details: ImageGenerationDetails,
): Decimal | undefined {
  return
}

function computeSpeechCost(
  _model: SpeechModelInfo,
  _details: SpeechGenerationDetails,
): Decimal | undefined {
  return
}

function computeTranscriptionCost(
  _model: TranscriptionModelInfo,
  _details: TranscriptionGenerationDetails,
): Decimal | undefined {
  return
}

function computeTextEmbeddingCost(
  _model: EmbeddingModelInfo,
  _details: TextEmbeddingGenerationDetails,
): Decimal | undefined {
  return
}
