'use client'

import { EditIcon, Trash2Icon } from 'lucide-react'

import type {
  EmbeddingModelInfo,
  ImageModelInfo,
  LanguageModelInfo, ProviderId,
  SpeechModelInfo,
  TranscriptionModelInfo
} from '@cared/providers'
import { Button } from '@cared/ui/components/button'

import type { EditableModel } from './model-item-edit'
import { CircleSpinner } from '@/components/spinner'

export function ModelItemView({
  index,
  providerId,
  model,
  isSaving,
  isRemoving,
  onEdit,
  onRemove,
}: {
  index: number
  providerId: ProviderId
  model: EditableModel
  isSaving: boolean
  isRemoving: boolean
  onEdit: () => void
  onRemove: () => Promise<void>
}) {
  const isDisabled = isSaving || isRemoving

  return (
    <div className="border rounded-lg p-4 my-4 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-medium">{model.model.name || `Model #${index + 1}`}</span>
          {model.isNew && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">New</span>
          )}
          {model.model.deprecated && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Deprecated
            </span>
          )}
          {model.model.retired && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Retired</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-6"
            onClick={onEdit}
            disabled={isDisabled}
          >
            <EditIcon className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-6"
            onClick={onRemove}
            disabled={isDisabled}
          >
            {isRemoving ? <CircleSpinner className="size-3" /> : <Trash2Icon className="size-3" />}
          </Button>
        </div>
      </div>

      {model.model.description && (
        <div className="text-sm text-muted-foreground">{model.model.description}</div>
      )}

      {/* Render model-specific view based on type */}
      {model.type === 'language' && (
        <LanguageModelItemView model={model.model as LanguageModelInfo} />
      )}
      {model.type === 'image' && <ImageModelItemView model={model.model as ImageModelInfo} />}
      {model.type === 'speech' && <SpeechModelItemView model={model.model as SpeechModelInfo} />}
      {model.type === 'transcription' && (
        <TranscriptionModelItemView model={model.model as TranscriptionModelInfo} />
      )}
      {model.type === 'textEmbedding' && (
        <EmbeddingModelItemView model={model.model as EmbeddingModelInfo} />
      )}
    </div>
  )
}

// Language Model Item View
function LanguageModelItemView({ model }: { model: LanguageModelInfo }) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      {model.contextWindow && (
        <div>
          Context Window: <span className="font-mono">{model.contextWindow.toLocaleString()}</span>
        </div>
      )}
      {model.maxOutputTokens && (
        <div>
          Max Output Tokens:{' '}
          <span className="font-mono">{model.maxOutputTokens.toLocaleString()}</span>
        </div>
      )}
      {model.inputTokenPrice && (
        <div>
          Input Token Price: <span className="font-mono">{model.inputTokenPrice}</span>
        </div>
      )}
      {model.cachedInputTokenPrice && (
        <div>
          Cached Input Token Price: <span className="font-mono">{model.cachedInputTokenPrice}</span>
        </div>
      )}
      {model.cacheInputTokenPrice && (
        <div>
          Cache Input Token Price:{' '}
          <span className="font-mono">
            {typeof model.cacheInputTokenPrice === 'string'
              ? model.cacheInputTokenPrice
              : JSON.stringify(model.cacheInputTokenPrice)}
          </span>
        </div>
      )}
      {model.outputTokenPrice && (
        <div>
          Output Token Price: <span className="font-mono">{model.outputTokenPrice}</span>
        </div>
      )}
    </div>
  )
}

// Image Model Item View
function ImageModelItemView({ model }: { model: ImageModelInfo }) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      {model.imageInputTokenPrice && (
        <div>
          Image Input Token Price: <span className="font-mono">{model.imageInputTokenPrice}</span>
        </div>
      )}
      {model.imageCachedInputTokenPrice && (
        <div>
          Image Cached Input Token Price:{' '}
          <span className="font-mono">{model.imageCachedInputTokenPrice}</span>
        </div>
      )}
      {model.imageOutputTokenPrice && (
        <div>
          Image Output Token Price: <span className="font-mono">{model.imageOutputTokenPrice}</span>
        </div>
      )}
      {model.textInputTokenPrice && (
        <div>
          Text Input Token Price: <span className="font-mono">{model.textInputTokenPrice}</span>
        </div>
      )}
      {model.textCachedInputTokenPrice && (
        <div>
          Text Cached Input Token Price:{' '}
          <span className="font-mono">{model.textCachedInputTokenPrice}</span>
        </div>
      )}
      {model.pricePerImage && (
        <div>
          Price Per Image:{' '}
          <span className="font-mono">
            {typeof model.pricePerImage === 'string'
              ? model.pricePerImage
              : JSON.stringify(model.pricePerImage)}
          </span>
        </div>
      )}
    </div>
  )
}

// Speech Model Item View
function SpeechModelItemView({ model }: { model: SpeechModelInfo }) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      {model.maxInputTokens && (
        <div>
          Max Input Tokens:{' '}
          <span className="font-mono">{model.maxInputTokens.toLocaleString()}</span>
        </div>
      )}
      {model.textTokenPrice && (
        <div>
          Text Token Price: <span className="font-mono">{model.textTokenPrice}</span>
        </div>
      )}
      {model.audioTokenPrice && (
        <div>
          Audio Token Price: <span className="font-mono">{model.audioTokenPrice}</span>
        </div>
      )}
    </div>
  )
}

// Transcription Model Item View
function TranscriptionModelItemView({ model }: { model: TranscriptionModelInfo }) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      {model.audioTokenPrice && (
        <div>
          Audio Token Price: <span className="font-mono">{model.audioTokenPrice}</span>
        </div>
      )}
      {model.textInputTokenPrice && (
        <div>
          Text Input Token Price: <span className="font-mono">{model.textInputTokenPrice}</span>
        </div>
      )}
      {model.textOutputTokenPrice && (
        <div>
          Text Output Token Price: <span className="font-mono">{model.textOutputTokenPrice}</span>
        </div>
      )}
    </div>
  )
}

// Embedding Model Item View
function EmbeddingModelItemView({ model }: { model: EmbeddingModelInfo }) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      {model.dimensions && (
        <div>
          Dimensions: <span className="font-mono">{model.dimensions.toLocaleString()}</span>
        </div>
      )}
      {model.tokenPrice && (
        <div>
          Token Price: <span className="font-mono">{model.tokenPrice}</span>
        </div>
      )}
    </div>
  )
}
