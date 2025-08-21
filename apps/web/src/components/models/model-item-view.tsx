'use client'

import { EditIcon, Trash2Icon } from 'lucide-react'
import { zuji } from 'zuji'

import type {
  EmbeddingModelInfo,
  ImageModelInfo,
  LanguageModelInfo,
  ProviderId,
  SpeechModelInfo,
  TranscriptionModelInfo,
} from '@cared/providers'
import { Button } from '@cared/ui/components/button'

import type { EditableModel } from './model-item-edit'
import { CircleSpinner } from '@/components/spinner'
import { CopyModelId } from './copy-model-id'

export function ModelItemView({
  index,
  providerId: _,
  model,
  isSaving,
  isRemoving,
  onEdit,
  onRemove,
  copyToClipboard,
}: {
  index: number
  providerId: ProviderId
  model: EditableModel
  isSaving: boolean
  isRemoving: boolean
  onEdit: () => void
  onRemove: () => Promise<void>
  copyToClipboard: (value: string) => void
}) {
  const isDisabled = isSaving || isRemoving

  return (
    <div className="border rounded-lg p-4 my-2 flex flex-col gap-2">
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

      <CopyModelId modelId={model.model.id} copyToClipboard={copyToClipboard} />

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
      <div className="flex flex-wrap gap-x-4">
        {model.contextWindow && (
          <div>
            Context length:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.contextWindow, 'compact-decimal')}
            </span>
          </div>
        )}
        {model.maxOutputTokens && (
          <div>
            Max output length:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.maxOutputTokens, 'compact-decimal')}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4">
        {model.inputTokenPrice && (
          <div>
            Input:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.inputTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
        {model.outputTokenPrice && (
          <div>
            Output:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.outputTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4">
        {model.cachedInputTokenPrice && (
          <div>
            {model.cacheInputTokenPrice ? 'Cache read' : 'Cache'}:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.cachedInputTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
        {model.cacheInputTokenPrice && (
          <div>
            Cache write:{' '}
            {typeof model.cacheInputTokenPrice === 'string' ? (
              <>
                <span className="font-mono font-medium text-foreground">
                  {zuji(model.cacheInputTokenPrice, 'standard-currency-usd')}/M
                </span>{' '}
                tokens
              </>
            ) : (
              JSON.stringify(model.cacheInputTokenPrice)
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Image Model Item View
function ImageModelItemView({ model }: { model: ImageModelInfo }) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div className="flex flex-wrap gap-x-4">
        {model.imageInputTokenPrice && (
          <div>
            Image input:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.imageInputTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
        {model.imageOutputTokenPrice && (
          <div>
            Image output:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.imageOutputTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4">
        {model.textInputTokenPrice && (
          <div>
            Text input:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.textInputTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
        {model.textCachedInputTokenPrice && (
          <div>
            Text cache:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.textCachedInputTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
      </div>
      {model.imageCachedInputTokenPrice && (
        <div>
          Image cache:{' '}
          <span className="font-mono font-medium text-foreground">
            {zuji(model.imageCachedInputTokenPrice, 'standard-currency-usd')}/M
          </span>{' '}
          tokens
        </div>
      )}
      {model.pricePerImage && (
        <div>
          Price per image:{' '}
          <span>
            {typeof model.pricePerImage === 'string' ? (
              <>
                <span className="font-mono font-medium text-foreground">
                  {zuji(model.pricePerImage, 'standard-currency-usd')}/M
                </span>{' '}
                tokens
              </>
            ) : (
              JSON.stringify(model.pricePerImage)
            )}
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
      <div className="flex flex-wrap gap-x-4">
        {model.maxInputTokens && (
          <div>
            Max input length:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.maxInputTokens, 'compact-decimal')}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4">
        {model.textTokenPrice && (
          <div>
            Text tokens:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.textTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
        {model.audioTokenPrice && (
          <div>
            Audio tokens:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.audioTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
      </div>
    </div>
  )
}

// Transcription Model Item View
function TranscriptionModelItemView({ model }: { model: TranscriptionModelInfo }) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div className="flex flex-wrap gap-x-4">
        {model.audioTokenPrice && (
          <div>
            Audio tokens:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.audioTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4">
        {model.textInputTokenPrice && (
          <div>
            Text input:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.textInputTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
        {model.textOutputTokenPrice && (
          <div>
            Text output:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.textOutputTokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
      </div>
    </div>
  )
}

// Embedding Model Item View
function EmbeddingModelItemView({ model }: { model: EmbeddingModelInfo }) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div className="flex flex-wrap gap-x-4">
        {model.dimensions && (
          <div>
            Dimensions:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.dimensions, 'standard-integer')}
            </span>
          </div>
        )}
        {model.tokenPrice && (
          <div>
            Token price:{' '}
            <span className="font-mono font-medium text-foreground">
              {zuji(model.tokenPrice, 'standard-currency-usd')}/M
            </span>{' '}
            tokens
          </div>
        )}
      </div>
    </div>
  )
}
